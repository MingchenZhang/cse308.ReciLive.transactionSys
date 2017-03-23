var GoogleAuth = require('google-auth-library');
var When = require('when');
var auth = new GoogleAuth;

const CLIENT_ID = '795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com';

var client = new auth.OAuth2(CLIENT_ID, '', '');

exports.getUserInfo = function (tokenID) {
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
