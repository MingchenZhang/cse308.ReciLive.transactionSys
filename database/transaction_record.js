var When = require('when');
var s = global.s;

var transactionDB = {};
var sessionDB = {};
exports.initDatabase = function (readyList) {
    var convDBPath = s.dbPath;
    var convDBReady = When.defer();
    readyList.push(convDBReady.promise);
    console.log('try to connect to ' + convDBPath);

    s.mongodb.connect(convDBPath, function (err, db) {
        if (err) {
            console.error('MongodbClient connection ' + convDBPath + ' failed');
            process.exit(1);
        } else {
            console.log('MongodbClient connection to ' + convDBPath + ' has been established');
            transactionDB.transactionColl = db.collection('transaction');
            sessionDB.sessionColl = db.collection('session');
            convDBReady.resolve();
        }
    });
};


exports.addTransaction = function (param) {
    var sessionID = param.sessionID;
    var index = param.index;
    var module = param.module;
    var description = param.description;
    var payload = param.payload;
    var createdBy = param.createdBy;

    var doc = {
        sessionID: sessionID,
        index: index,
        module: module,
        description: description,
        payload: payload,
        createdAt:new Date(),
        createdBy:createdBy
    };

    return transactionDB.transactionColl.insertOne(doc).catch(function (err) {
        console.error(err);
        throw err;
    });
};

exports.getTransactionCursor = function (param) {
    var sessionID = param.sessionID;
    var startAt = param.startAt;

    return transactionDB.transactionColl.find({sessionID: sessionID, index: {$gte: startAt}}).sort({index: 1});
};

exports.getLastTransactionIndex = function (param) {
    var sessionID = param.sessionID;
    return transactionDB.transactionColl.findOne({sessionID: sessionID}).sort({index: -1}).limit(1).then((doc)=> {
        if(doc) return doc.index;
        else return -1;
    });
};

exports.dropTransactionSession = function (param) {
    var sessionID = param.sessionID;
    transactionDB.transactionColl.deleteMany({sessionID: sessionID}).catch(function (err) {
            console.error(err);
        }
    );
};

exports.addSession = function (param) {
    var sessionID = param.sessionID;
    var privilege = param.privilege;
    var name = param.name;
    var startDate = param.startDate;
    var endDate = param.endDate;
    var status = param.status;

    var doc = {
        sessionID: sessionID,
        privilege: privilege,
        name: name,
        startDate: startDate,
        endDate: endDate,
        status: status
    };
    return sessionID.sessionColl.insertOne(doc).catch(function (err) {
        console.error(err);
        throw err;
    });
};

exports.getSession = function () {
    return sessionDB.sessionColl.find().toArray();
};

exports.deleteSession = function (param) {
    var sessionID = param.sessionID;
    return sessionDB.sessionColl.deleteOne({sessionID: sessionID});
};