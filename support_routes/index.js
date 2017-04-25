var Express = require('express');

exports.getRoute = function (s) {
    var router = Express.Router();

    router.use('/', require('./home').getRoute(s));
    router.use('/',require('./classroom')).getRoute(s);
    router.use('/',require('./user')).getRoute(s);
    router.use('/',require('./recitation')).getRoute(s);
    return router;
};