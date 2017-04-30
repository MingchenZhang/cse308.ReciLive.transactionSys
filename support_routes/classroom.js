var Express = require('express');               //router
var BodyParser = require('body-parser');        //json parser
var When = require('when');                     // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();              //return all the parsere
    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-class-list', jsonParser, function (req, res, next) {    //return all the class list according to user's role
        if (req.userLoginInfo.record.role == "Instructor") {
            s.classConn.getClassesByOwner(req.userLoginInfo.record._id).then((r) => {
                let names = [];
                r.forEach(function (element) {
                    names.push([element._id, element.name]);
                });
                res.send({result: true, list: names});
            }).catch((e) => {
                    res.send({result: false, reason: e.message ? e.message : 'get classese by instructor error'});
                }
            )
            ;
        } else if (req.userLoginInfo.record.role == "Student") {
            s.classConn.getClassesByStudent(req.userLoginInfo.record._id).then((r) => {
                let names = [];
                r.forEach(function (element) {
                    names.push([element._id, element.name]);
                });
                res.send({result: true, list: names});
            }).catch((e) => {
                    res.send({result: false, reason: e.message || 'get classese by student error'});
                }
            );
        } else {
            res.send({result: false, reason: "no such role"});
        }
    });

    router.post('/ajax/add-class', jsonParser, function (req, res, next) {      //add class room to database
        s.classConn.addClass(req.body.name, req.body.startDate, req.body.endDate, req.userLoginInfo.record._id).then((clazz) => {       //return a premise
            return s.tools.listPromise(req.body.students, (email) => {
                return s.userConn.getUserByEmail(email).then((user) => {
                    if (user) {
                        return s.classConn.addStudentToClass(user._id, clazz._id);
                    } else {
                        var userID = s.mongodb.ObjectID();
                        return s.userConn.addUser(null, email, null, null, userID).then(() => {
                            return s.classConn.addStudentToClass(userID, clazz._id);
                        });
                    }
                });
            });
        }).then((result) => {
            res.send({result: true});
        }).catch((err) => {
            res.status(400).send({result: false, reason: err.message ? err.message : 'unknown error'});
        });
    });

    router.post('/ajax/get-edit-class-info', jsonParser, (req, res, next) => {           //edit mode get class information
        response = {};
        promiseList = [];
        promiseList[0] = s.classConn.getClassByMongoID(req.body.classId, req.userLoginInfo.record._id).then((clazz) => {
            response.result4classInfo =true;
            response.classInfo = clazz;
        }).catch((err) => {      //catch all the error from db
            response.result4classInfo = false;
            response.reason4classInfo = err || "error in get edit class info db operation";
        });
        promiseList[1] = s.classConn.getPrivilegeList(req.body.classId, req.userLoginInfo.record._id).then((privilegeList) => {
            response.result4Privilege = true;
            response.privilegeList = privilegeList;
        }).catch((err) => {
            response.result4privilege = false;
            response.reason4privilege = err || "error in get privilege list";
        })
        When.all(promiseList).then(() => {
            if (response.reason4classInfo || response.reason4privilege) {
                response.ressult = false;
                response.reason = (response.reason4privilege || '') + '\n' + (response.reason4classInfo || '');
                res.send(response);
            } else {
                response.result = true;
                res.send(response);
            }
        })
    });

    router.post('/ajax/edit-class', jsonParser, (req, res, next) => {           //response the edit class button
        when.all(s.classConn.editClassByMongoID(req.body.classId, {     //primise chain 0:modify class info 1:remove all privilege info
            name: req.body.name,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        }, req.userLoginInfo.record._id)).then((clazz) => {       //return a premise list clazz = [clazzMongoID, result4deleteAllPrivilege]
            return s.tools.listPromise(req.body.students, (email) => {              //add privilege info
                return s.userConn.getUserByEmail(email).then((user) => {
                    if (user) {
                        return s.classConn.addStudentToClass(user._id, clazz[0]._id);
                    } else {
                        var userID = s.mongodb.ObjectID();
                        return s.userConn.addUser(null, email, null, null, userID).then(() => {
                            return s.classConn.addStudentToClass(userID, clazz[0]._id);
                        });
                    }
                });
            });
        }).then((result) => {
            res.send({result: true});
        }).catch((err) => {
            res.status(400).send({result: false, reason: err.message ? err.message : 'unknown error'});
        });
    });


    return router;
};
