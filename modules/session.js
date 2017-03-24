var s = global.s;

exports.session = function () {
    var lastTransactionIndex = -1;
    var sessionID=0;
    this.init = function (ID) {
        sessionID=ID;
        return lastTransactionIndex= s.transactionRecord.getLastTransactionIndex(sessionID).then((index)=>{
            lastTransactionIndex=index;
        });
    };
    this.addTransaction = function () {

    };
    this.listTransaction = function (startAt) {

    };
    this.close = function () {

    };
};