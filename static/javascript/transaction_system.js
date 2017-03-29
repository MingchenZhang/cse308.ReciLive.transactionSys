// dependence: jquery, bluebird

function TransactionSystem(path) {
    var connection;
    var transactions = [];
    var latestReady = null;
    var modules = {};

    this.init = function () {
        connection = wsConnection(path, sendStart, receive, false);
        var ready, fail;
        latestReady = new Promise(function (resolve, reject) {
            ready = resolve;
            fail = reject;
        });
        latestReady.ready = ready;
        latestReady.fail = fail;
        return latestReady;
    };
    function sendStart() {
        connection.send(JSON.stringify({
            type: "initialization",
            startAt: transactions[transactions.length - 1].index + 1
        }));
    }

    function receive(e) {
        var object = JSON.parse(e.data);
        if (object.type == 'latest_send') {
            latestReady.ready();
        }
        if (object.index == transactions[transactions.length - 1].index + 1) {
            transactions.push(object);
            modules[object.module].update(object.index,
                object.description,
                object.createdBy,
                object.createdAt,
                object.payload);
        } else {
            console.error('transaction receive out of order');
            connection.reset();
        }
    }

    this.registerModule = function (moduleName, module) {
        modules[moduleName] = module;
    };

    this.newTransaction = function (module, description, payload) {
        var attemptInterval = 200;

        function sendAttempt(err) {
            return new Promise(function (resolve, reject) {
                var index = transactions[transactions.length - 1].index + 1;
                var transaction = {
                    index: index,
                    module: module,
                    description: description,
                    payload: payload
                };
                return $.ajax({
                    url: 'transaction_post',
                    type: 'post',
                    data: JSON.stringify(transaction),
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                }).done(function (result) {
                    if (result.status == 'ok')
                        return resolve({index: index});
                    else
                        return reject(result);
                }).fail(function (err) {
                    return reject(err);
                });
            });
        }

        function failDelay(err) {
            return new Promise(function (resolve, reject) {
                setTimeout(reject.bind(null, err), attemptInterval);
            });
        }

        var p = Promise.reject();
        for (var i = 0; i < 10; i++) {
            p = p.catch(sendAttempt).catch(failDelay);
        }
        p.catch(function (err) {
            console.error('newTransaction retry reach maximum');
            throw 'newTransaction retry reach maximum';
        });
        return p;
    };

}

function transaction() {
    this.index = null;
    this.createdAt = null;
    this.createdBy = null;
    this.module = null;
    this.description = {};
    this.payload = null;
}

function wsConnection(destination, onConnectCallback, receiveCallback, resend) {
    var self = this;
    var ws;

    this.connect = function () {
        ws = createWebSocket(destination);
        ws.addEventListener("open", function (e) {
            onConnectCallback(e);
        });
        ws.addEventListener("message", function (e) {
            receiveCallback(e);
        });
        ws.addEventListener('close', function () {
            console.log('connection to %s closed', destination);
            self.connect();
        });
        ws.addEventListener('error', function () {
            console.log('connection to %s failed', destination);
            ws.close();
            self.connect();
        });
    };

    function createWebSocket(path) {
        var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
        return new WebSocket(protocolPrefix + '//' + location.host + path, 'transaction');
    }

    this.send = function (data) {
        if (ws.readyState != ws.OPEN) {
            this.connect();
            if (resend) {
                ws.addEventListener('open', function (e) {
                    // remove current event listener
                    e.target.removeEventListener(e.type, arguments.callee);
                    ws.send(data);
                });
            }
        } else {
            ws.send(data);
        }
    };

    this.reset = function () {
        ws.close();

    };
}

function module(transactionSystem) {

    this.update = function (index, description, createdBy, createdAt, payload) {

    };
    this.reset = function () {

    };
}