const When = require('when');
const s = global.s;

var classDB = {};
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
            classDB.classesColl.createIndex({numericID:1}, {unique: true});

            classDB.classEnrollColl = db.collection('classEnroll');
            classDB.classEnrollColl.createIndex({'class':1});
            classDB.classEnrollColl.createIndex({'user':1});

            classDB.recitationColl = db.collection('recitation');
            classDB.recitationColl.createIndex({owner:1});

            classDBReady.resolve();
        }
    });
};

//class: name, startDate, endDate, createdAt, owner
//recitation: numericID, name, startDate, endDate, createdAt, parentClass
exports.getClassesByOwner = function (owner) {
    return classDB.classesColl.find({owner}).sort({'createdAt':-1}).toArray();
};

exports.getClassesByStudent = function (student) {
    return classDB.classEnrollColl.find({user:student}).sort({'createdAt':-1}).toArray().then((classesList)=>{
        var proList = [];
        classesList.forEach((clazz, index)=>{
            proList[index] = new When.Promise((resolve, reject)=>{
                classDB.classesColl.findOne({_id: clazz.class}, function (err, result) {
                    if(err) return reject(err);
                    if(!result) return reject('no result found');
                    return resolve(result);
                });
            });
        });
        return proList;
    });
};

exports.addStudentToClass = function(student, clazz){
    return classDB.classEnrollColl.insertOne({'user':student, 'class':clazz});
};

exports.addClass = function (name, startDate, endDate, owner) {
    return classDB.classesColl.insertOne({
        name,
        startDate,
        endDate,
        createdAt: new Date(),
        owner,
    });
};

exports.addRecitation = function (name, startDate, endDate, createdAt, parentClass) {
    var numericID = Math.floor(Math.random()*10000000);
    return classDB.recitationColl.insertOne({
        numericID,
        name,
        startDate,
        endDate,
        createdAt: new Date(),
        parentClass,
    });
};

exports.getRecitationsByClass = function (parentClass) {
    return classDB.recitationColl.find({parentClass}).sort({'createdAt':-1}).toArray();
};

