var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');

exports.getRoute = function (s) {
    var router = Express.Router();

    var urlParser = BodyParser.urlencoded({extended: false, limit: '10kb'});

    // classroom page
    router.get('/', function (req, res, next) {

    });

    router.post('/transaction_post', function (req, res, next) {

    });

    return router;
};