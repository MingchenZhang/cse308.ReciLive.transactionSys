var GoogleAuth = require('google-auth-library');
var When = require('when');
var auth = new GoogleAuth;

var CLIENT_ID = s.googleLoginClientID;

var client = new auth.OAuth2(CLIENT_ID, '', '');

exports.getUserInfo = function (tokenID) {
    //dummy user info
    if (tokenID == "123")  return new When.resolve({userID: 123, name: "instructor"});
    if (tokenID == "234")  return new When.resolve({userID: 234, name: "studentA"});
    if (tokenID == "345")  return new When.resolve({userID: 345, name: "studentB"});
    return new When.promise((resolve, reject)=> {
        client.verifyIdToken(tokenID,
            CLIENT_ID,
            function (e, login) {
                if (e) {
                    console.error(e);
                    return reject({reason:6});

                }
                var payload = login.getPayload();
                resolve({
                    userID: payload['sub'],
                    name: payload['name']
                });
            });
    });
};
