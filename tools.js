var GoogleAuth = require('google-auth-library');
var When = require('When');

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

    tools.listPromise = function(sourceList, queryFunction){
        var promiseList = [];
        sourceList.forEach((source, index)=>{
            promiseList[index] = queryFunction(source);
        });
        return When.all(promiseList);
    };

    return tools;
};