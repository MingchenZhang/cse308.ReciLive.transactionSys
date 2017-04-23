var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var Classroom = require('./classroom');
var Checker = require('./parameterChecker');

var s = global.s;

exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post(['/dispatch_classroom'], jsonParser, function (req, res, next) {
        if (!Checker.dispatchRequest(req.body)) return res.send({status: "error", reason: 5});
        s.sessionManager.addSession({
            sessionID: req.body.classNumber,
            privilege: req.body.privilege,
            name: req.body.name,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: req.body.status
        }).then(() => {
            res.send({status: "ok"});
        }).catch((err) => {
            res.send({status: "error", reason: err.reason});
        });
    });

    router.use('/room/:classroomNumber', function (req, res, next) {
        req.classroomNumber = parseInt(req.params.classroomNumber);
        req.classroomSession = s.sessionManager.getSession(req.classroomNumber);
        if (!req.userLoginInfo) return res.status(401).send("please login first");
        if (req.classroomSession) {
            if (req.classroomSession.userInSession(req.userLoginInfo.userID)) {
                next();
            } else {
                res.status(401);
            }
        } else {
            res.status(400).send("classroom not found");
        }
    }, Classroom.getRoute(s));

    router.post('/give_cookie', jsonParser, function (req, res, next) {
        for (var key in req.body) {
            if (!req.body.hasOwnProperty(key)) continue;
            res.cookie(key, req.body[key], {});
        }
        res.send({status: "ok"});
    });
    router.get('/give_cookie', jsonParser, function (req, res, next) {
        for (var key in req.query) {
            if (!req.query.hasOwnProperty(key)) continue;
            res.cookie(key, req.query[key], {});
        }
        res.send({status: "ok"});
    });
    router.post('/current_time', jsonParser, (req, res, next) => {
        res.send({status:"ok",time:(new Date()).toISOString()});
        //TODO: send end time if there is one
    });
    router.get('/current_time', jsonParser, (req, res, next) => {
        res.send({status:"ok",time:(new Date()).toISOString()});
        //TODO: send end time if there is one
    });
    return router;
};