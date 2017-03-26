var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');

//
exports.getRoute = function (s) {
    var router = Express.Router({mergeParams: true});

    var urlParser = BodyParser.urlencoded({extended: false, limit: '10kb'});

    // classroom page
    router.get('/', function (req, res, next) {
        res.render("transaction-test", {username: req.userLoginInfo.name});
    });

    router.post('/transaction_post', function (req, res, next) {

    });

    return router;
};