exports.WSHandler = function () {
    var subhandlerMap = {};

    this.handle = function (ws) {
        var location = url.parse(ws.upgradeReq.url, true);

        var handler = subhandlerMap[location];
        if (handler != undefined) {
            return handler(ws);
        } else {
            console.error("handler not defined on path: " + location);
        }
    };

    this.addRoute = function (path, handler) {
        subhandlerMap[path] = handler;
    };

    this.removeRoute = function (path) {
        subhandlerMap[path] = undefined;
    };
};