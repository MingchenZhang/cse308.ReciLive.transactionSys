var GoogleAuth = require('google-auth-library');

var auth = new GoogleAuth;


exports.getToolSet = function (s) {
    var tools = {};

    tools.isAllString = function (obj) {
        for(var key in obj){
            if (!obj.hasOwnProperty(key)) continue;
            if(typeof obj[key] !== 'string') return false;
        }
        return true;
    };

    // tools.nosqlSafeTest = function(object){
    //     if(typeof object != 'object') return true;
    //     for(var key in object){
    //         console.log('testing:'+key);
    //         if(key[0] == '$') return false;
    //         if(typeof object[key] == 'object' && !tools.nosqlSafeTest(object[key])) return false;
    //     }
    //     return true;
    // };

    return tools;
};