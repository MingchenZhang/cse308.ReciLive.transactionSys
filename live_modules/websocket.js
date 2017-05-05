var Cookie = require('cookie');
var Login = require('./google_login');
const Url = require('url');

exports.WSHandler = function () {
    var subhandlerMap = {};

    this.handle = function (ws) {
        var location = Url.parse(ws.upgradeReq.url, true);
        var cookies = Cookie.parse(ws.upgradeReq.headers.cookie || '');
        log.debug('ws route "' + location.path + '" triggered');
        var messageCache = [];
        var preMessageHandle = (message)=>{
            messageCache.push(message);
        };
        ws.on('message', preMessageHandle);
        Login.liveGetUserInfo(cookies.login_session).then((userInfo)=>{
            ws.userLoginInfo = userInfo;
            ws.userLoginInfo.userID = userInfo._id;
            var handler = subhandlerMap[location.path];
            if (handler != undefined) {
                ws.removeListener('message', preMessageHandle);
                handler(ws);
                messageCache.forEach((message)=>{
                    ws.emit('message', message);
                });
            } else {
                console.error("handler not defined on path: " + location.path);
                ws.removeListener('message', preMessageHandle);
                ws.close();
            }
        }).catch((err)=>{
            ws.send(JSON.stringify({type: "error", reason: 6}));
            ws.close();
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