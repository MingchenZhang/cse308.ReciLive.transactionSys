//classroom list
var Session = require("./session");
var When = require('when');
var classroomList = {};
var s = global.s;

exports.initSession = function () {
    let sessionListPromise = s.transactionRecord.getSession();
    var sessionInitPromise = [];
    return sessionListPromise.then((sessionList)=> {
        if (sessionList) {
            sessionList.forEach(function (sessionItem) {
                console.log("import session in to session list:" + sessionItem.sessionID);
                classroomList[sessionItem.sessionID] = new Session.session();
                sessionInitPromise.push(
                    classroomList[sessionItem.sessionID].resumeSession(sessionItem)
                );
            })
        }
    }).then(When.all(sessionInitPromise));

};

exports.addSessionDummy = function () {
    classroomList[1] = {"sessionID": 1, "privilege": {123: "all", 234: "all", 345: "all"}, name: "dummy Session name"};
    return s.transactionRecord.addSession(1, {123: "all", 234: "all", 345: "all"}, "dummy Session name", "", "", '');
};

exports.addSession = function (param) {
    var sessionID = param.sessionID;
    var privilege = param.privilege;
    var name = param.name;
    var startDate = param.startDate;
    var endDate = param.endDate;
    var status = param.status;

    if (classroomList[sessionID]) {
        console.error("try to add a exist session" + sessionItem.sessionID);
        return new When.reject({reason: 3});
    }
    classroomList[sessionID] = new Session.session();
    return classroomList[sessionID].newSession({sessionID, privilege, name, startDate, endDate, status});
};
//deletesSession return a promise
exports.deleteSession = function (param) {
    var sessionID = param.sessionID;

    if (classroomList[sessionID]) console.err("overwrite exist session" + sessionItem.sessionID);
    else {
        classroomList[sessionID] = undefined;
        return s.transactionRecord.deleteSession(sessionID);
    }
};
exports.addTransaction = function (param) {
    var sessionID = param.sessionID;
    var index = param.index;
    var module = param.module;
    var description = param.description;
    var payload = param.payload;
    var createdBy = param.createdBy;
};
exports.getSession = function (sessionID) {
    return classroomList[sessionID];
};
