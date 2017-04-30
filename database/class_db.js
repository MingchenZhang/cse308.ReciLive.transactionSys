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
            console.error('MongodbClient connection ' + classDBPath + ' failed')
            process.exit(1);
        } else {
            console.log('MongodbClient connection to ' + classDBPath + ' has been established');

            classDB.classesColl = db.collection('classes');
            classDB.classesColl.createIndex({owner: 1});
            classDB.classesColl.createIndex({createdAt: -1});

            classDB.classEnrollColl = db.collection('classEnroll');
            classDB.classEnrollColl.createIndex({'class': 1});
            classDB.classEnrollColl.createIndex({'user': 1});

            classDB.recitationColl = db.collection('recitation');
            classDB.recitationColl.createIndex({owner: 1});
            classDB.recitationColl.createIndex({numericID: 1}, {unique: true});

            classDBReady.resolve();
        }
    });
};

//class: name, startDate, endDate, createdAt, owner
//recitation: numericID, name, startDate, endDate, createdAt, parentClass
exports.getClassesByOwner = function (owner) {
    return classDB.classesColl.find({owner}).sort({'createdAt': -1}).toArray();
};

exports.getClassesByStudent = function (student) {
    return classDB.classEnrollColl.find({user: student}).sort({_id: -1}).toArray().then((classesList) => {
        var proList = [];
        classesList.forEach((clazz, index) => {
            proList[index] = new When.Promise((resolve, reject) => {
                classDB.classesColl.findOne({_id: clazz.class}, function (err, result) {
                    if (err) return reject(err);
                    if (!result) return reject(new Error('no result found'));
                    return resolve(result);
                });
            });
        });
        return When.all(proList);
    });
};

/**
 *
 * @param classID class moongo id(_id)
 * @param owner owner mongo id
 * @returns {Promise.<TResult>|Promise}
 */
exports.getClassByMongoID = (classID, owner) => {
    return classDB.classesColl.find({owner}).sort({'createdAt': -1}).toArray().then((classList) => { //privilege check
        for (clazz in classList) {
            if (classList[clazz]._id == classID) return classDB.classesColl.findOne({_id: classList[clazz]._id}).then((result) => {
                return result;
            })
        }
    })
};

/**
 * change the class information by instuctor
 * @param classID   mongoid
 * @param classInfo     obj have all the modified info
 * @param owner         mongoid
 * @returns {Promise|Promise.<TResult>}
 */
exports.editClassByMongoID = (classID, classInfo, owner) => {
    var primiseList = [];
    primiseList[0] = classDB.classesColl.find({owner}).sort({'createdAt': -1}).toArray().then((classList) => { //privilege check
        var primiseList4classList = [];
        classList.forEach((clazz, index) => {
            if (clazz._id == classID) primiseList4classList[index] = classDB.classesColl.updateMany({id: classID}, {    //update info
                $set: {
                    name: classInfo.name,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                }
            })    //all the error send to controller to handle
        })
        return primiseList;
    });
    primiseList[1] = classDB.classEnrollColl.removeMany({class: classID}); //remove all the privilege information for rewrite
    return primiseList;
};
/**
 * send all the privilege back with email and student id
 * @param classID       mongoid
 * @param owner         mongoid
 * @returns {Promise|Promise.<TResult>}
 */
exports.getPrivilegeList = (classID, owner) => {
    var privilegeList = []
    return classDB.classesColl.find({owner}).sort({'createdAt': -1}).toArray().then((classList) => { //privilege check
        for (clazz in classList) {
            if (classList[clazz]._id == classID) {
                return classDB.classEnrollColl.find({class: classList[clazz]._id}).toArray().then((studentList) => {
                    var primiseList = [];
                    for (index in studentList) {
                        primiseList[index] =
                            s.userConn.getUserByMongoID(studentList[index].user).then((user) => {
                                privilegeList[index] = {_id: studentList[index].user, email: user.email};
                            });
                    }
                    return When.all(primiseList).then(() => {
                        return privilegeList;
                    });
                })
            }
        }
    })///
};

exports.getStudentsByClass = function (clazz) {
    return classDB.classEnrollColl.find({class: s.mongodb.ObjectID(clazz)}).sort({_id: -1}).toArray();
};

exports.addStudentToClass = function (student, clazz) {
    return classDB.classEnrollColl.insertOne({'user': student, 'class': clazz});
};

exports.addClass = function (name, startDate, endDate, owner) {
    var insertObj = {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdAt: new Date(),
        owner: s.mongodb.ObjectID(owner),
    };
    return classDB.classesColl.insertOne(insertObj).then(() => insertObj);
};

exports.addRecitation = function (name, startDate, endDate, parentClass) {
    var numericID = Math.floor(Math.random() * 10000000);
    var insert = {
        numericID,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdAt: new Date(),
        parentClass: s.mongodb.ObjectID(parentClass),
    };
    return classDB.recitationColl.insertOne(insert).then(() => {
        return insert
    });
};

exports.getRecitationsByClass = function (parentClass) {
    return classDB.recitationColl.find({
        parentClass: s.mongodb.ObjectID(parentClass)
    }).sort({'createdAt': -1}).toArray();
};

exports.getRecitationByMongoID = (recitationId)=>{
    return classDB.recitationColl.find({_id:s.mongodb.ObjectID(recitationId)}).toArray();
};

// exports.editRecitation = (owner, reciationId, recitationInfo)=>{
//     return;
// };