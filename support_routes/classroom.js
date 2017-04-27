var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();
    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-class-list', jsonParser, function (req, res, next) {
        s.userConn.getUserByGoogleID(req.userLoginInfo.userID).then((response) => {
            if (response) {
                if (response.role == "Instructor") {
                    s.classConn.getClassesByOwner(response._id).then((r) => {
                      let names = [];
                      r.forEach(function(element) {
                        names.push(element.name);
                      });
                      res.send({result: true, list: names});
                    }).catch((e) => {
                            if (typeof e == "error") {
                                res.send({result: false, reason: e.message});
                            } else
                                res.send({result: false, reason: 'get classese by instructor error'});
                        }
                    )
                    ;
                } else if (response.role == "Student") {
                    s.classConn.getClassesByStudent(response._id).then((r) => {
                      let names = [];
                      r.forEach(function(element) {
                        names.push(element.name);
                      });
                      res.send({result: true, list: names});
                    }).catch((e) => {
                            if (typeof e == "error") {
                                res.send({result: false, reason: e.message});
                            } else
                                res.send({result: false, reason: 'get classese by student error'});
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
    });

    router.post('/ajax/add-class', jsonParser, function (req, res, next) {
      // TODO handle students
      s.userConn.getUserByGoogleID(req.userLoginInfo.userID).then((response) => {
        s.classConn.addClass(req.body.name, req.body.startDate, req.body.endDate, response._id).then((r) => {
            res.send({result: true});
        }).catch((e) => {
                if (typeof e == "error") {
                    res.send({result: false, reason: e.message});
                } else {
                    res.send({result: false, reason: "error in class DB add class"});
                }
            }
        );
      }).catch((e) => {
              if (typeof e == "error") {
                  res.send({result: false, reason: e.message});
              } else {
                  res.send({result: false, reason: "google auth fail"});
              }
          }
      );
    });
    return router;
};
