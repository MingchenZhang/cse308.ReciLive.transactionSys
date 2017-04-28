var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');                                  // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();                          //create a new router later on will add in the app.js
    var jsonParser = BodyParser.json({limit: '10kb'});      //json parser parse the request before router run it's content

    router.get('/course', jsonParser, function (req, res, next) {       //redirect to course page depend on the role
        if (req.userLoginInfo.record.role == "Instructor") {
            res.render("course_instructor.ejs");
        } else if (req.userLoginInfo.record.role == "Student") {
            res.render("course_student.ejs");
        }
    });

    router.post('/ajax/check-user', jsonParser, function (req, res, next) {     //check user has role for front end sign_up needed
        if (req.userLoginInfo.record.role) {//TODO: double check record
            res.send({result: true, sign_up: false, redirect: '/course'});
        } else {
            res.send({result: true, sign_up: true});
        }
    });

    router.post('/ajax/sign_up', jsonParser, (req, res, next) => {          //new user sign_up
        s.userConn.setUserInfo(req.userLoginInfo.record._id,{role:req.body.role}).then(() => {
            res.send({result: true, redirect: '/course'});
        }).catch((e) => {req.body.role
            res.send({result: false, reason: e.message ? e.message : "error add user to db"});
        });
    });

    router.get('/ajax/live_get_user_info', (req, res, next) => {     //live send mongo id and get all user info
        s.userConn.getUserByGoogleID(req.query.id).then((userInfo) => {
            res.send(userInfo);
        }).catch((e) => {
            res.status(400).send({result: false, reason: e.message ? e.message : "error get user by google id"});
        });
    });

    return router;
};
