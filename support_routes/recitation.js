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
                    recitations.push([element._id, element.name]);
                  });
                  res.send({result: true, list: recitations});
                } else {
                    res.send({result: false, error: "nothing find in database"});
                }
          }
        ).catch((e) => {
            res.send({result: false, error: e.message ? e.message : "error in class DB add class"});
        });
    });

    router.post('/ajax/add-recitation', jsonParser, (req, res, next) => {
        s.classConn.addRecitation(req.body.name, req.body.startDate, req.body.endDate, req.body.class).then((recitation) => {
            if (recitation) {
                var privilege = {};
                privilege[req.userLoginInfo.record._id] = ["admin", "slides", "sound_control"];
                s.classConn.getStudentsByClass(req.body.class).then((response) => {
                    response.forEach((student) => {
                        privilege[student._id] = []
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
                        if (error) return res.status(500).send({
                            status: "error",
                            error,
                            statusCode: response.statusCode
                        });
                        return res.send(body);
                    });
                }).catch((e) => {
                    res.send({result: false, error: e.message ? e.message : "error in db get students list"});
                });
            } else {
                res.send({result: false, error: 'no response from database'});
            }
        }).catch((e) => {
            res.send({result: false, error: e.message ? e.message : "error in class DB add class"});
        });
    });


    return router;
};
