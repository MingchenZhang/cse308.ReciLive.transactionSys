var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');              // used by sequential callback
var Request = require("request");
exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-recitation-list', jsonParser, function (req, res, next) {
        var current_class = req.body.class;
        s.classConn.getRecitationsByClass(current_class).then((response) => {
                if (response) {
                    let recitations = [];
                    response.forEach(function (element) {
                        recitations.push([element.numericID, element.name, element._id]);
                    });
                    res.send({result: true, list: recitations});
                } else {
                    res.send({result: false, reason: "nothing find in database"});
                }
            }
        ).catch((e) => {
            res.send({result: false, reason: e.message ? e.message : "error in class DB add class"});
        });
    });

    router.post('/ajax/add-recitation', jsonParser, (req, res, next) => {
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.addRecitation(req.body.name, req.body.startDate, req.body.endDate, req.body.class).then((recitation) => {
                if (recitation) {
                    var privilege = {};
                    var userList = {};
                    privilege[req.userLoginInfo.record._id] = ["admin", "slides", "sound_control", 'draw'];
                    userList[req.userLoginInfo.record._id] = {
                        'name': req.userLoginInfo.username,
                        'email': req.userLoginInfo.record.email
                    };
                    s.classConn.getStudentsByClass(req.body.class).then((response) => {
                        response.forEach((student) => {
                            privilege[student.user] = [];
                        });
                        s.tools.listPromise(response, (student) => {
                            return s.userConn.getUserByMongoID(student.user).then((userInfo) => {
                                userList[userInfo._id] = {'name': userInfo.username, 'email': userInfo.email};
                            });
                        }).then(() => {
                            Request({
                                method: 'POST',
                                url: "http://room.recilive.stream/dispatch_classroom",
                                json: {
                                    "classNumber": recitation.numericID,
                                    "privilege": privilege,
                                    "name": recitation.name,
                                    "startDate": recitation.startDate,
                                    "endDate": recitation.endDate,
                                    "status": "LIVE",
                                    "userList": userList
                                }
                            }, (error, response, body) => {
                                if (error) return res.status(500).send({
                                    result: false,
                                    error,
                                    statusCode: response.statusCode
                                });
                                return res.send({result: true, body});
                            });
                        });
                    }).catch((e) => {
                        res.send({result: false, reason: e.message || "error in db get students list"});
                    });
                } else {
                    res.send({result: false, reason: 'no response from database'});
                }
            }).catch((e) => {
                res.send({result: false, reason: e.message || "error in class DB - add class"});
            });
        }
    });

    router.post('/ajax/get-recitation-info', jsonParser, (req, res, next) => {            //give recitation info for edit or view
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.getRecitationsByClass(req.body.class).then((recitation) => {
                if (recitation.length == 0)
                    res.send({result: false, reason: "no such recitation"});
                else res.send({result: true, recitation: recitation[0]});
            }).catch((err) => {
                res.send({result: false, reason: e.message || "error in get recitation info db operation"});
            });
        }
    });

    router.post('/ajax/edit-recitation', jsonParser, (req, res, next) => {
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.editRecitation(req.userLoginInfo.record._id, req.body.recitationId, {
                name: req.body.name,
                startDate: req.body.startDate,
                endDate: req.body.endDate
            }).then(() => {
                res.send({result: true});
            }).catch((err) => {
                res.send({result: false, reason: e.message || "error in edit recitation info db operation"});
            });
        }
    });

    router.post('/ajax/delete-recitation', jsonParser, (req, res, next) => {
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.deleteRecitation(req.body.recitationId, req.userLoginInfo.record._id).then(() => {
                res.send({result: true});
            }).catch((err) => {
                res.send({result: false, reason: e.message || "error in delete recitation info db operation"});
            });
        }
    });

    router.post('/ajax/set-recitation-resource', jsonParser, (req, res, next) => {           //save the recitation resource metadata in db
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.setRecitationResource(req.query.recitationID, req.userLoginInfo.userID, req.body).then((response) => {
                res.send({result: true});
            }).catch((err) => {
                res.send({result: false, reason: err.message || "error in set recitation resource info db operation"});
            });
        }
    });

    router.get('/ajax/get-recitation-resource', jsonParser, (req, res, next) => {       //get the recitation resource metadata in db
        if (!req.userLoginInfo) res.send({result: false, reason: "please login first"});
        else {
            s.classConn.getRecitationResource(req.query.recitationID, req.userLoginInfo.record._id).then((resources) => {
                res.send(resources);
            }).catch((err) => {
                res.status(400).send(err);
            });
        }
    });

    return router;
};
