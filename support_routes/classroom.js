var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-class-list', jsonParser, function (req, res, next) {
        s.userConn.getUserByGoogleID(req.googleLoginInfo.userId).then((response) => {
            if (response) {
                if (response.role == "Instructor") {
                    s.classDB.getClassesByStudent(response._id).then((r) => {
                        res.send({result: true, list: r});
                    }).catch((e) => {
                            if (typeof e == "error") {
                                res.send({result: false, reason: e.message});
                            } else
                                res.send({result: false, reason: 'get classese by student error'});
                        }
                    )
                    ;
                } else if (response.role == "Student") {
                    s.classDB.getClassesByOwner(response._id).then((r) => {
                        res.send({result: true, list: r});
                    }).catch((e) => {
                            if (typeof e == "error") {
                                res.send({result: false, reason: e.message});
                            } else
                                res.send({result: false, reason: 'get classese by instructor error'});
                        }
                    )
                    ;
                } else {
                    res.send({result: false, reason: "no such role"});
                }
            } else {
                res.send({result: false, reason: "google auth fail"});
            }
        }).catch((e) => {
            if (typeof e == "error") {
                res.send({result: false, reason: e.message});
            } else
                res.send({result: false, reason: 'get classese by instructor error'});
        });
        res.send({result: true, list: list});
    });

    router.post('/ajax/add-class', jsonParser, function (req, res, next) {
        s.classDB.addClass(req.body.name, req.body.startDate, req.body.endDate, req.body.owner).then((response) => {
            res.send({result: true});
        }).catch((e) => {
                if (typeof e == "error") {
                    res.send({result: false, error: e.message});
                } else {
                    res.send({result: false, error: "error in class DB add class"});
                }
            }
        );
        res.send({result: true});
    });
    return router;
};
