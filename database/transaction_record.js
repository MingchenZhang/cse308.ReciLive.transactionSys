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


exports.addTransaction = function (sessionID, index, module, description, payload,createdBy) {

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

exports.getTransactionCursor = function (sessionID, index) {
    return transactionDB.transactionColl.find({sessionID: sessionID, index: {$gte: index}}).sort({index: 1});
};

exports.getLastTransactionIndex = function (sessionID) {
    return transactionDB.transactionColl.findOne({sessionID: sessionID}).sort({index: -1}).limit(1).then((doc)=> {
        return doc.index;
    });
};

exports.dropTransactionSession = function (sessionID) {
    transactionDB.transactionColl.deleteMany({sessionID: sessionID}).catch(function (err) {
            console.error(err);
        }
    );
};

exports.addSession = function (sessionID, privilege, name, startDate, endDate, status) {
    var doc = {
        sessionID: sessionID,
        privilege: privilege,
        name: name,
        startDate: startDate,
        endDate: endDate,
        status: status
    }
    return sessionID.sessionColl.insertOne(doc).catch(function (err) {
        console.error(err);
        throw err;
    });
};

exports.getSession = function () {
    return sessionDB.sessionColl.find().toArray();
};

exports.deleteSession = function (Session) {
    return sessionDB.sessionColl.deleteOne({sessionID: sessionID});
};