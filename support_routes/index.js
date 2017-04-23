var Express = require('express');

exports.getRoute = function (s) {
    var router = Express.Router();

    router.use('/', require('./home').getRoute(s));

    return router;
};