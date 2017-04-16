var When = require('when');
var Cookie = require('cookie');
var assert = require('assert');
var EventEmitter = require('events');
var s = global.s;

exports.session = function () {
    var self = this;
    var lastTransactionIndex = -1;
    self.sessionID = -1;
    self.privilege = null;
    self.name = null;
    self.startDate = null;
    self.endDate = null;
    self.status = null;
    self.slidesNumber = -1;
    var clients = [];
    var soundClients = [];
    var soundSpeaker = [];

    this.newSession = function (param) {
        if (self.sessionID >= 0) return When.reject({reason: "reinitialization of session:" + self.sessionID});

        self.sessionID = param.sessionID;
        self.privilege = param.privilege;
        self.name = param.name;
        self.startDate = param.startDate;
        self.endDate = param.endDate;
        self.status = param.status;
        self.slidesNumber = param.slidesNumber;
        return s.transactionRecord.addSession({
            sessionID: self.sessionID,
            privilege: self.privilege,
            name: self.name,
            startDate: self.startDate,
            endDate: self.endDate,
            status: self.status,
            slidesNumber: self.slidesNumber
        }).then((value) => {
            s.wsHandler.addRoute("/room/" + self.sessionID + "/transaction", self.wsHandleTransaction);
            s.wsHandler.addRoute("/room/" + self.sessionID + "/sound", self.wsHandleSound);
            return value;
        });
    };
    this.resumeSession = function (param) {
        if (self.sessionID >= 0) return When.reject({reason: "reinitialization of session:" + self.sessionID});

        self.sessionID = param.sessionID;
        self.privilege = param.privilege;
        self.name = param.name;
        self.startDate = param.startDate;
        self.endDate = param.endDate;
        self.status = param.status;
        self.slidesNumber = param.slidesNumber;
        return s.transactionRecord.getLastTransactionIndex({sessionID: self.sessionID})
            .then((index) => {
                lastTransactionIndex = index;
            })
            .then((value) => {
                s.wsHandler.addRoute("/room/" + self.sessionID + "/transaction", self.wsHandleTransaction);
                s.wsHandler.addRoute("/room/" + self.sessionID + "/sound", self.wsHandleSound);
                if (!s.inProduction) {
                    console.log("new session resumed");
                    console.log(param);
                    console.log("last index: " + lastTransactionIndex);
                }
                return value;
            });
    };

    this.wsHandleTransaction = function (ws) {
        log.debug('start transaction wsHandler for ' + self.sessionID);
        ws.roomSession = self;
        ws.initStatus = -1; // the index of the last transaction that this client holds

        function socketPanic(reason) {
            ws.send(JSON.stringify({type: "error", reason: reason}));
            clients.splice(clients.indexOf(ws), 1);
            ws.close();
        }

        function sendToTheLatest(startAt) {
            var resultEvent = new EventEmitter();

            function send(doc) {
                if (doc) {
                    assert(doc.index == ws.initStatus + 1);
                    ws.send(JSON.stringify({
                        type: "transaction_push",
                        index: doc.index,
                        module: doc.module,
                        description: doc.description,
                        createdAt: doc.createdAt,
                        createdBy: doc.createdBy,
                        payload: doc.payload
                    }));
                    ws.initStatus++;
                    return true;
                } else {
                    if (ws.initStatus > lastTransactionIndex) {
                        socketPanic(9);
                        throw "client side error, reason 9";
                    }
                    if (ws.initStatus == lastTransactionIndex) {
                        delete ws.initStatus;
                        clients.push(ws);
                        resultEvent.emit('done');
                    } else {
                        if (!s.inProduction) console.log('missed latest transaction, requerying. ');
                        sendToTheLatest(ws.initStatus + 1);
                    }
                    return false;
                }
            }

            self.listTransaction(startAt, send);
            return resultEvent;
        }

        ws.on('message', function (message) {
            try {
                message = JSON.parse(message)
            }
            catch (e) {
                if (!s.inProduction) console.error("receive abnormal message from websocket: " + message);
                return socketPanic(5);
            }
            try {
                if (message.type == "initialization" && typeof message.startAt == "number") {
                    if (ws.initStatus != -1) return socketPanic(8);
                    ws.initStatus = message.startAt - 1;
                    sendToTheLatest(message.startAt).on('done', function () {

                        ws.send(JSON.stringify({
                            type: 'latest_sent'
                        }));
                    });
                } else {
                    if (!s.inProduction) console.error("receive abnormal message format from websocket: " + message);
                    return socketPanic(5);
                }
            } catch (e) {
                console.error(e)
            }
        });
        ws.on('close', function () {
            log.debug('transaction websocket to ' + ws.userLoginInfo.userID + ' closed');
            clients.splice(clients.indexOf(ws), 1);
            ws.close();
        });
    };

    this.wsHandleSound = function (ws) {
        ws.nextSoundFrame = null; // the sound object to denote the next sound tobe send, null if live
        ws.jumpRequestDate = null; // date the request was given
        ws.jumpRequestTime = null; // requested date
        ws.sendingTimer = null;

        log.debug('start sound wsHandler. room id: ' + self.sessionID + ' user: ' + ws.userLoginInfo.userID);
        ws.roomSession = self;
        soundClients.push(ws);

        function sendSoundFrame(){
            var start = new Date();
            try{
                ws.send(ws.nextSoundFrame.data.buffer);
            }catch (e){
                return;
            }
            s.transactionRecord.getSoundCursor({sessionID:self.sessionID, startAt: ws.nextSoundFrame.createdAt}).next().then((soundFrame)=>{
                log.debug('sound frame found: '+(soundFrame?soundFrame._id:null));
                if(!soundFrame) {
                    ws.nextSoundFrame = null;
                    return;
                }
                var delay = soundFrame.createdAt - ws.jumpRequestTime - (new Date()-ws.jumpRequestDate);
                log.debug('schedule to send sound frame in '+delay);
                ws.sendingTimer = setTimeout(sendSoundFrame, delay);
                ws.nextSoundFrame = soundFrame;
            }).catch((err)=>{
                log.warning('encounter error during retrieving sound frame: '+err);
            });
        }

        ws.on('message', function (message, flags) {
            if(flags.binary){
                //if (soundSpeaker.indexOf(ws.userLoginInfo.userID) <0) return; TODO: re-enable privilege check
                //log.debug('receive sound from userid: ' + ws.userLoginInfo.userID);
                s.transactionRecord.addSound({sessionID:self.sessionID, createdAt: new Date(), data: message});
                soundClients.forEach((client) => {
                    if(client.nextSoundFrame) return; // client is in playback mode
                    try {
                        client.send(message);
                    } catch (e) {
                        console.error(e);
                    }
                });
            }else{
                try{
                    message = JSON.parse(message);
                }catch(e){
                    log.warning(()=>{return 'message not valid from sound channel: '+message});
                    return false;
                }
                log.debug(()=>{return 'sound channel command receive: '+JSON.stringify(message)});
                if(message.type == 'jump_to' && message.startAt){
                    var startAt = new Date(message.startAt);
                    s.transactionRecord.getSoundCursor({sessionID:self.sessionID, startAt}).next((err, soundFrame)=>{
                        if(err) log.warning('encounter error during retrieving sound frame: '+err);
                        log.debug('sound frame found during jump: '+(soundFrame?soundFrame._id:null));
                        if(!soundFrame) {
                            ws.nextSoundFrame = null;
                            if(ws.sendingTimer) clearTimeout(ws.sendingTimer);
                            return;
                        }
                        clearTimeout(ws.sendingTimer);
                        ws.sendingTimer = setTimeout(sendSoundFrame, 0);
                        ws.nextSoundFrame = soundFrame;
                        ws.jumpRequestDate = new Date();
                        ws.jumpRequestTime = startAt;
                    });
                }else if(message.type == 'jump_to' && !message.startAt){
                    clearTimeout(ws.sendingTimer);
                    ws.nextSoundFrame = null;
                }else{
                    log.warning('receive invalid sound command: '+JSON.stringify(message));
                }
            }
        });
        ws.on('close', function () {
            log.debug('sound websocket to ' + ws.userLoginInfo.userID + ' closed');
            clearTimeout(ws.sendingTimer);
            soundClients.splice(soundClients.indexOf(ws), 1);
            soundSpeaker.splice(soundSpeaker.indexOf(ws), 1);
        });
    };

    this.addTransaction = function (transaction) {
        var index = transaction.index;
        var module = transaction.module;
        var description = transaction.description;
        var payload = transaction.payload;
        var createdBy = transaction.createdBy;

        if (index != lastTransactionIndex + 1) return When.reject({reason: 1});

        if (self.privilege[createdBy] != 'all' && self.privilege[createdBy].indexOf(module) == -1)
            return When.reject({reason: 2});

        transaction.sessionID = self.sessionID;
        transaction.createdAt = new Date();

        log.debug(() => 'adding transaction:' + JSON.stringify(transaction));

        understandTransaction(transaction);

        lastTransactionIndex++;
        clients.forEach((client) => {
            try {
                client.send(JSON.stringify({
                    type: 'transaction_push',
                    index,
                    module,
                    description,
                    createdAt: transaction.createdAt,
                    createdBy,
                    payload
                }));
            } catch (e) {
                console.error(e);
            }
        });

        return s.transactionRecord.addTransaction(transaction);
    };

    this.listTransaction = function (startAt, sendNext) {
        return new Promise((resolve, reject) => {
            var cursor = s.transactionRecord.getTransactionCursor({sessionID: self.sessionID, startAt: startAt});

            function getMore() {
                cursor.next((err, result) => {
                    try{
                        if (err) reject(err);
                        if (result) {
                            if (sendNext(result)) getMore();
                        } else {
                            sendNext(null);
                            resolve();
                        }
                    }catch (e) {
                        log.error(e);
                        return reject(e);
                    }
                });
            }

            getMore();
        });
    };
    this.close = function () {
        var finish = [
            s.transactionRecord.deleteSession({sessionID: self.sessionID}),
            s.transactionRecord.dropTransactionSession({sessionID: self.sessionID}),
            new When.Promise((resolve, reject) => {
                s.wsHandler.removeRoute("/room/" + self.sessionID);
                resolve();
            })// TODO: close all ws connection
        ];
        return When.all(finish);
    };
    this.userInSession = function (userID) {
        return userID in self.privilege;
    };
    this.userEditable = function (userID, module) {
        return self.privilege[userID].indexOf(module) != -1;
    };

    function understandTransaction(transaction) {
        if (transaction.module == 'sound_control' && transaction.description.speakerChange) {
            transaction.description.speakerChange.forEach((tuple)=> {
                if (tuple[1] && soundSpeaker.indexOf(tuple[0]) < 0) soundSpeaker.push(tuple[0]);
                else soundSpeaker.splice(soundSpeaker.indexOf(tuple[0]), 1);
            });
        } else {
            return false;
        }
        return true;
    }
};