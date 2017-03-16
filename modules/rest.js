var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var Classroom = require('classroom');

exports.getRoute = function (s) {
    var router = Express.Router();

    var urlParser = BodyParser.urlencoded({extended: false, limit: '10kb'});

    router.get('/dispatch_classroom', function (req, res, next) {
        classNumber = req.classNumber;
        if (classroomList[req.classNumber]) {
            //classroom number conflict check
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({status: "error", reason: 3}));
            return;
        } else {
            //correct class number
            classNumber = req.classNumber;
            console.log("get class room number: " + classNumber);
            classroomList[classNumber] = {studentList = req.studentGoogleID, IDTokenCash = [], instructorID = req.instructorID
        }
            console.log(" the number of students is: " + req.studentGoogleID.length);
            console.log(" the instructor id is " + req.instructorID);
        }
    });

    router.all('/room/:classroomNumber', function (req, res, next) {
        req.classroomNumber = req.params.classroomNumber;
        next();
    }, Classroom.getRoute(s));

    return router;
};