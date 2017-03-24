//classroom list
var classroomList = {};
var s = global.s;

exports.initSession = function () {
    let sessionList = s.transactionRecord.getSession();
    if (sessionList) {
        sessionList.forEach(function (sessionItem) {
            console.log("import session in to session list:" + sessionItem.sessionID);
            if (classroomList[sessionItem.sessionID]) console.err("overwrite exist session" + sessionItem.sessionID);
            classroomList[sessionItem.sessionID] = sessionItem;
        })
    }
};

exports.addSessionDummy = function () {
    classroomList[1] = {"sessionID": 1, "privilege": {123: "all", 234: "all", 345: "all"}, name:"dummy Session name"};
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
        return new When.reject({reason:3});
    }
    classroomList[sessionID] = {
        sessionID: sessionID,
        privilege: privilege,
        name:name,
        startDate:startDate,
        endDate:endDate,
        status:status,
    };
   return s.transactionRecord.addSession(sessionID,privilege,name,startDate,endDate,status);
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