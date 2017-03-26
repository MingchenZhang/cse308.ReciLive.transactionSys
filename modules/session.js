var When = require('when');
var s = global.s;

exports.session = function () {
    var self = this;
    var lastTransactionIndex = -1;
    this.sessionID = -1;
    this.privilege = null;
    this.name = null;
    this.startDate = null;
    this.endDate = null;
    this.status = null;

    this.newSession = function (param) {
        if (self.sessionID >= 0) return When.reject({reason: "reinitialization of session:" + self.sessionID});

        self.sessionID = param.sessionID;
        self.privilege = param.privilege;
        self.name = param.name;
        self.startDate = param.startDate;
        self.endDate = param.endDate;
        self.status = param.status;

        function wsHandle() {

        }

        return s.transactionRecord.addSession({
            sessionID: self.sessionID,
            privilege: self.privilege,
            name: self.name,
            startDate: self.startDate,
            endDate: self.endDate,
            status: self.status
        }).then((value)=> {
            s.wsHandler.addRoute("/room/" + self.sessionID, wsHandle);
            return value;
        });
    };
    this.resumeSession = function (param) {
        if (self.sessionID >= 0) return When.reject({reason: "reinitialization of session:" + self.sessionID});

        self.sessionID = param.sessionID;
        var privilege = param.privilege;
        var name = param.name;
        var startDate = param.startDate;
        var endDate = param.endDate;
        var status = param.status;

        function wsHandle() {

        }

        return s.transactionRecord.getLastTransactionIndex({sessionID: self.sessionID})
            .then((index)=> {
                lastTransactionIndex = index;
            })
            .then((value)=> {
                s.wsHandler.addRoute("/room/" + self.sessionID, wsHandle);
                if(!s.inProduction){
                    console.log("new session resumed");
                    console.log(param);
                    console.log("last index: " + lastTransactionIndex);
                }
                return value;
            });
    };

    this.addTransaction = function (transaction) {
        var index = param.index;
        var module = param.module;
        var description = param.description;
        var payload = param.payload;
        var createdBy = param.createdBy;

        if (index != lastTransactionIndex + 1) return When.reject({reason: 1});

        if (self.privilege[createdBy] != 'all' && self.privilege[createdBy].indexOf(module) == -1)
            return When.reject({reason: 2});

        return s.transactionRecord.addTransaction(transaction);
    };

    this.listTransaction = function (startAt, sendNext) {
        return new Promise((resolve, reject)=> {
            var cursor = s.transactionRecord.getTransactionCursor({sessionID: self.sessionID, startAt: startAt});

            function getMore() {
                cursor.next((err, result)=> {
                    if (err) reject(err);
                    if (result) {
                        sendNext(result);
                        getMore();
                    } else resolve();
                });
            }
        });
    };
    this.close = function () {
        var finish = [
            s.transactionRecord.deleteSession({sessionID: self.sessionID}),
            s.transactionRecord.dropTransactionSession({sessionID: self.sessionID}),
            new When.Promise((resolve, reject)=> {
                s.wsHandler.removeRoute("/room/" + self.sessionID);
                resolve();
            })
        ];
        return When.all(finish);
    };
    this.userInSession = function (userID) {
        return userID in self.privilege;
    };
    this.userEditable = function(userID, module){
        return self.privilege[userID].indexOf(module)!=-1;
    }
};