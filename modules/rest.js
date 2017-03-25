var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var Classroom = require('classroom');
var DataHandler = require('../database/transaction_record.js');

var s = global.s;

exports.getRoute = function (s) {
    var router = Express.Router();
    var urlParser = BodyParser.urlencoded({extended: false, limit: '10kb'});

    router.get('/dispatch_classroom', function (req, res, next) {
        return s.sessionManager.addSession({
            sessionID: req.classNumber,
            privilege: req.privilege,
            name: req.name,
            startDate: req.startDate,
            endDate: req.endDate,
            status: req.status
        }).then(()=> {
            return {status: "ok"}
        }).catch((err)=> {
            return {status: "error", reason: err.reason};
        });

    });

    router.get('/dummy_classroom', function (req, res, next) {
        s.sessionManager.addSessionDummy().then(()=> {
            return {status: "ok"}
        }).catch((err)=> {
            return {status: "error", reason: err.reason};
        });
    });

    router.all('/room/:classroomNumber', function (req, res, next) {
        req.classroomNumber = req.params.classroomNumber;
        next();
    }, Classroom.getRoute(s));

    return router;
};