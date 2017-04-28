var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();
    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-class-list', jsonParser, function (req, res, next) {
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

    router.post('/ajax/add-class', jsonParser, function (req, res, next) {
        s.classConn.addClass(req.body.name, req.body.startDate, req.body.endDate, req.userLoginInfo.record._id).then((clazz) => {
            return s.tools.listPromise(req.body.students, (email)=>{
                return s.userConn.getUserByEmail(email).then((user)=>{
                    if(user){
                        return s.classConn.addStudentToClass(user._id, clazz._id);
                    }else{
                        var userID = s.mongodb.ObjectID();
                        return s.userConn.addUser(null, email, null, null, userID).then(()=>{
                            return s.classConn.addStudentToClass(userID, clazz._id);
                        });
                    }
                });
            });
        }).then((result)=>{
            res.send({result: true});
        }).catch((err)=>{
            res.status(400).send({result: false, reason: err.message?err.message:'unknown error'});
        });
    });
    return router;
};
