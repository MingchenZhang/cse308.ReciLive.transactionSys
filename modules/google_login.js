var GoogleAuth = require('google-auth-library');
var When = require('when');
var auth = new GoogleAuth;

const CLIENT_ID = '795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com';

var client = new auth.OAuth2(CLIENT_ID, '', '');

exports.getUserInfo = function (tokenID) {
    //dummy user info
    if(tokenID=="123")  return new When.resolve({userID:123,name:"instructor"});
    if(tokenID=="234")  return new When.resolve({userID:234,name:"studentA"});
    if(tokenID=="345")  return new When.resolve({userID:345,name:"studentB"});
    return new When.promise((resolve, reject)=> {
        client.verifyIdToken(tokenID,
            CLIENT_ID,
            function (e, login) {
                var payload = login.getPayload();
                var userid = payload['sub'];
                resolve({userID: userid});
            });
    });
};
