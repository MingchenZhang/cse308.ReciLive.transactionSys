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

// var client = new auth.OAuth2("795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com", '', '');
// //google auth
// var getUserIdByToken = new function (token) {
//     var userid = -1;
//     client.verifyIdToken(
//         token,
//         "795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com",
//         // Or, if multiple clients access the backend:
//         //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
//         function (e, login) {
//             var payload = login.getPayload();
//             userid = payload['sub'];
//             // If request specified a G Suite domain:
//             //var domain = payload['hd'];
//         });
//     if (userid != -1) {
//         console.log("get user id " + userid + "by idtoken");
//         return userid;
//     } else {
//         console.log("can't get google user id with this idtoken");
//     }
// };

    return tools;
};