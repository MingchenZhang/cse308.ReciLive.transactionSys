const GoogleAuth = require('google-auth-library');
const When = require('when');
const Request = require("request");
var auth = new GoogleAuth;

var client = null;

exports.getUserInfo = function (tokenID) {
    if(!client) client = new auth.OAuth2(s.googleLoginClientID, '', '');
    //dummy user info
    if (tokenID == "123")  return new When.resolve({userID: 123, name: "instructor", email:'test@test'});
    if (tokenID == "234")  return new When.resolve({userID: 234, name: "studentA"});
    if (tokenID == "345")  return new When.resolve({userID: 345, name: "studentB"});
    return new When.promise((resolve, reject)=> {
        client.verifyIdToken(tokenID,
            s.googleLoginClientID,
            function (e, login) {
                if (e) {
                    console.error(e);
                    return reject({reason:6});

                }
                var payload = login.getPayload();
                resolve({
                    userID: payload['sub'],
                    name: payload['name'],
                    email: payload['email'],
                    photo: payload['picture']
                });
            });
    });
};

exports.liveGetUserInfo = (session)=>{
    return new When.Promise((resolve, reject)=>{
        Request({
            method: 'GET',
            json: true,
            url:(s.inProduction?"https":"http")+"://recilive.stream/ajax/live-get-user-info?session="+encodeURIComponent(session),
        }, (error, response, body)=>{
            if(error && body) return reject(new Error('login info cannot be verified'));
            else return resolve(body);
        });
    });
};