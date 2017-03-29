var Cookie = require('cookie');
var GoogleLogin = require('./google_login');

exports.WSHandler = function () {
    var subhandlerMap = {};

    this.handle = function (ws) {
        var location = url.parse(ws.upgradeReq.url, true);
        var cookies = Cookie.parse(req.headers.cookie || '');
        GoogleLogin.getUserInfo(cookies.IDToken)
            .then((userInfo)=>{
                ws.userLoginInfo = userInfo;
                var handler = subhandlerMap[location];
                if (handler != undefined) {
                    return handler(ws);
                } else {
                    console.error("handler not defined on path: " + location);
                }
            })
            .catch((err)=>{
                ws.send({type:"error", reason: 6});
            });
    };

    this.addRoute = function (path, handler) {
        subhandlerMap[path] = handler;
    };

    this.removeRoute = function (path) {
        subhandlerMap[path] = undefined;
    };
};