var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var ParameterChecker = require('./parameterChecker');
var MongoEscape = require('mongo-escape').escape;

exports.getRoute = function (s) {
    var router = Express.Router({mergeParams: true});

    var jsonParser = BodyParser.json({limit: '10mb'});

    // classroom page
    router.get('/', function (req, res, next) {
        res.render("main_student", {username: req.userLoginInfo.name, classroomNumber: req.classroomNumber});
    });

    router.post('/transaction_post', jsonParser, function (req, res, next) {
        var index = req.body.index;
        var module = req.body.module;
        var description = MongoEscape(req.body.description);
        var payload = MongoEscape(req.body.payload);

        if (!ParameterChecker.transactionPush(req.body))
            return res.status(400).send({status: 'error', reason: 5});

        var createdBy = req.userLoginInfo.userID;

        req.classroomSession.addTransaction({
            index,
            module,
            description,
            payload,
            createdBy,
        }).then(()=> {
            res.send({status: 'ok'});
        }).catch((err)=> {
            var message = {status: 'error'};
            if (err.reason) message.reason = err.reason;
            else err.reason = 7;
            if (!s.inProduction) message.detail = err;
            res.send(message);
        });
    });

    router.get('/my_privilege', function (req, res, next) {
        var privilege = req.classroomSession.privilege[req.userLoginInfo.userID];
        if(privilege) return res.send({status:'ok', privilege: privilege});
        else return res.send({status:'error', reason: 2});
    });

    return router;
};