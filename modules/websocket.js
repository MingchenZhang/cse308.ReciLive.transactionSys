var Cookie = require('cookie');
var GoogleLogin = require('./google_login');
const Url = require('url');

exports.WSHandler = function () {
    var subhandlerMap = {};

    this.handle = function (ws) {
        var location = Url.parse(ws.upgradeReq.url, true);
        var cookies = Cookie.parse(ws.upgradeReq.headers.cookie || '');
        log.debug('ws route "' + location.path + '" triggered');
        GoogleLogin.getUserInfo(cookies.IDToken)
            .then((userInfo)=> {
                ws.userLoginInfo = userInfo;
                var handler = subhandlerMap[location.path];
                if (handler != undefined) {
                    return handler(ws);
                } else {
                    console.error("handler not defined on path: " + location.path);
                }
            })
            .catch((err)=> {
                ws.send({type: "error", reason: 6});
            });
    };

    this.addRoute = function (path, handler) {
        log.debug('ws route "' + path + '" added');
        subhandlerMap[path] = handler;
    };

    this.removeRoute = function (path) {
        log.debug('ws route "' + path + '" removed');
        subhandlerMap[path] = undefined;
    };
};