exports.WSHandler = function () {
    var subhandlerMap = {};

    this.handler = function (ws) {
        var location = url.parse(ws.upgradeReq.url, true);

        var handler = subhandlerMap[location];
        if(handler != undefined){
            return handler(ws);
        }
    };

    this.addRoute = function (path, handler) {
        subhandlerMap[path] = handler;
    };

    this.removeRoute = function (path) {
        subhandlerMap[path] = undefined;
    };
};