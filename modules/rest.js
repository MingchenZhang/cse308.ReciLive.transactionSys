var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var Classroom = require('classroom');
var DataHandler = require('../database/transaction_record.js');
exports.getRoute = function (s) {
    var router = Express.Router();
    var urlParser = BodyParser.urlencoded({extended: false, limit: '10kb'});

    router.get('/dispatch_classroom', function (req, res, next) {

    });

    router.all('/room/:classroomNumber', function (req, res, next) {
        req.classroomNumber = req.params.classroomNumber;
        next();
    }, Classroom.getRoute(s));

    return router;
};