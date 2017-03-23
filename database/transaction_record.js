var When = require('when');
var s = global.s;

var transactionDB = {};
exports.initDatabase = function (readyList) {
    var convDBPath = s.dbPath
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

            convDBReady.resolve();
        }
    });

}


exports.addTransaction = function (sessionID, index, module, description, payload) {

    var doc = {
        sessionID: sessionID,
        index: index,
        module: module,
        description: description,
        payload: payload
    };

    return transactionDB.transactionColl.insertOne(doc).catch(function (err) {
        console.error(err);
        throw err;
    });
};

exports.getTransactionCursor = function (sessionID, index) {
    return transactionDB.transactionColl.find({sessionID: sessionID, index: {$gte: index}}).sort({index: 1});
};

experts.getLastTransactionIndex = function (sessionID) {
    return transactionDB.transactionColl.findOne({sessionID: sessionID}).sort({index: -1}).limit(1).then((doc)=> {
        return doc.index;
    });
};

experts.dropTransactionSession = function (sessionID) {
    transactionDB.transactionColl.deleteMany({sessionID: sessionID}).catch(function (err) {
            console.error(err);
        }
    );
};