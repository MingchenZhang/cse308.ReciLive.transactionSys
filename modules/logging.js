exports.debug = function (message) {
    if(s.inProduction) return;
    console.log(message);
};