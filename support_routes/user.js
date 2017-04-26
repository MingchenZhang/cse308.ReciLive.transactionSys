var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.get('/course', jsonParser, function (req, res, next) {
        s.userConn.getUserByEmail(req.userLoginInfo.email).then((response) => {
            if (response) {
                if (response.role == "Instructor") {
                    res.render("course_instructor.ejs");
                } else if (response.role == "Student") {
                    res.render("course_student.ejs");
                }
            } else {
                res.status(505);
            }
        });
    });

    router.post('/ajax/check-user', jsonParser, function (req, res, next) {
        s.userConn.getUserByGoogleID(req.userLoginInfo.userID).then((response) => {
            if (response) {
                res.send({result: true, sign_up: false, redirect: '/course'});
            } else {
                res.send({result: true, sign_up: true});
            }
        }).catch((e) => {
            if (typeof e == "error")
                res.send({result: false, reason: e.message});
            else res.send({result: false, reason: "error get user by google login"});
        });
    });


    router.post('/ajax/sign_up', jsonParser, (req, res, next) => {
        s.userConn.addUser(req.userLoginInfo.userID, req.userLoginInfo.email, req.body.role, req.userLoginInfo.name).then(() => {
            console.log(req.body.role);
            res.send({result: true});
        }).catch((e) => {
            if (typeof e == "error")
                res.send({result: false, reason: e.message});
            else res.send({result: false, reason: "error add user to db"});
        });
    });

    router.post('/class', jsonParser, (req, res, next) => {
        s.userConn.addUser(req.userLoginInfo.userID, req.userLoginInfo.email, req.body.role, req.userLoginInfo.name).then((response) => {
            if (response) {
                res.send({redirect: '/course'});
            } else {
                res.status(505);
            }
        }).catch((e) => {
            if (typeof e == "error")
                res.send({result: false, reason: e.message});
            else res.send({result: false, reason: "error get user by google login"});
        });
    });

    return router;
};
