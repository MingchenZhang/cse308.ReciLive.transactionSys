exports.debug = function (message) {
    if(s.inProduction) return;
    if(typeof message == "function")
        console.log(message());
    else
        console.log(message);
};