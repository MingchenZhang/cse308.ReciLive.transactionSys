const When = require('when');
const s = global.s;

var classDB = {};
var recitationDB = {};
exports.initDatabase = function (readyList) {
    var classDBPath = s.dbPath + "class";
    var classDBReady = When.defer();
    readyList.push(classDBReady.promise);
    console.log('try to connect to ' + classDBPath);

    s.mongodb.MongoClient.connect(classDBPath, function (err, db) {
        if (err) {
            console.error('MongodbClient connection ' + classDBPath + ' failed');
            process.exit(1);
        } else {
            console.log('MongodbClient connection to ' + classDBPath + ' has been established');
            classDB.classesColl = db.collection('classes');
            classDB.classesColl.createIndex({owner:1});
            classDB.classesColl.createIndex({createdAt:-1});
            classDBReady.resolve();
        }
    });
};

//class: name, startDate, endDate, createdAt, owner
//recitation: numericID, name, startDate, endDate, createdAt, class
exports.getClassesByOwner = function (owner) {
    return classDB.classesColl.find({owner}, {sort: [['cratedAt', -1]]});
};

exports.addClass = function (name, startDate, endDate, owner) {
    var numericID
    return classDB.classesColl.insertOne({
        name,
        startDate,
        endDate,
        owner,
    });
};
