var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();              //return all the parsere
    var jsonParser = BodyParser.json({limit: '10kb'});

/*    router.get('/ajax/get-resource', urlParser, function (req, res, next) {
        res.render('home.ejs');
    });*/
    return router;
};
