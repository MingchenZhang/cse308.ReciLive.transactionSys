var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-recitation-list', jsonParser, function (req, res, next) {
        var current_class = req.body.class;
        s.classConn.getRecitationsByClass(current_class).then((response) => {
                if (response) {
                    res.send({result: true, list: respnse, id: current_class});
                } else {
                    res.send({result: false, error: "nothing find in database"});
                }
            }
        ).catch((e) => {
            if (e.message) {
                res.send({result: false, error: e.message});
            } else {
                res.send({result: false, error: "error in class DB add class"});
            }
        });
    });

    router.post('/ajax/add-recitation', jsonParser,  (req, res, next)=> {
        s.classConn.addRecitation(req.body.name, req.body.startDate, req.body.endDate, req.body.createdAt, req.body.class).then((recitation) => {
            if (recitation) {
                var privilege = {};
                privilege[req.userLoginInfo.userID] = ["admin", "slides", "sound_control"];
                s.classConn.getStudentsByClass(req.body.class).then((response)=>{
                    response.foreach((student)=>{
                        privilege[student.googleID] = []
                    });
                    Request({
                        method: 'POST',
                        url: "http://room.recilive.stream/dispatch_classroom",
                        json: {
                            "classNumber": recitation.numericID,
                            "privilege": privilege,
                            "name": recitation.name,
                            "startDate": recitation.startDate,
                            "endDate": recitation.endDate,
                            "status": "LIVE"
                        }
                    }, (error, response, body) => {
                        if (error) return res.status(500).send({status: "error", error, statusCode: response.statusCode});
                        return res.send(body);
                    });
                }).catch((e) => {
                    if (typeof e == "error") {
                        res.send({result: false, error: e.message});
                    } else {
                        res.send({result: false, error: "error in db get students list"});
                    }
                });
            } else {
                res.send({result:false,error:'no response from database'});
            }
        }).catch((e) => {
            if (typeof e == "error") {
                res.send({result: false, error: e.message});
            } else {
                res.send({result: false, error: "error in class DB add class"});
            }
        });
    });


    return router;
};
