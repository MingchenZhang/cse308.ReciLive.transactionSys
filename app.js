var Express = require('express');
var Http = require('http');
var Https = require('https');
var url = require('url');
var CookieParser = require('cookie-parser');
var Helmet = require('helmet');
var Mongodb = require('mongodb');
var Cluster = require('cluster');
var When = require('when');
var Ejs = require('ejs');
var Fs = require('fs');
var WSWebSocket = require("ws").Server;
var Cookie=require('cookie-parser');

var Tool = require('./tool.js');
var startupPromises = []; // wait for all initialization to finish

var app = Express();

var client = new auth.OAuth2("795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com", '', '');
//google auth
var getUserIdByToken = new function(token){
var userid=-1;
client.verifyIdToken(
    token,
    "795827068788-0l5tdn5u7pm0f6gphs8covvp4usgjguv.apps.googleusercontent.com",
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function(e, login) {
      var payload = login.getPayload();
       userid = payload['sub'];
      // If request specified a G Suite domain:
      //var domain = payload['hd'];
    });
    if(userid!=-1){
        console.log("get user id "+userid+"by idtoken");
        return userid;}else{
        console.log("can't get google user id with this idtoken");
        }
};

// process static request directly
app.use('/static', Express.static(__dirname + '/static'));
app.use(Cookie);

app.set('view engine', 'ejs');
//classroom list
var classroomList={};
//setup classroom
app.get('dispatch_classroom',function(req,res,next{
                                       classNumber=req.classNumber;
                                       if (classroomList[req.classNumber]){
    //classroom number conflict check
res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ status:"error",reason:3 }));
    return;
}else{
        //correct class number
        classNumber=req.classNumber;
    console.log("get class room number: "+classNumber);
    classroomList[classNumber]={studentList=req.studentGoogleID,IDTokenCash=[],instructorID=req.instructorID};
    console.log(" the number of students is: "+req.studentGoogleID.length);
    console.log(" the instructor id is " +req.instructorID);
    //TODO:remove when instructor end section
        }
                                       }));
//parse classroom number from url
app.param('classroomNumber', function(request, response, next, classroomNumber) {
  // Fetch the classroomNumber by its ID (classroomNumber) from a database
  // Save the found story object into request object
  request.classroomNumber = classroomNumber;
    return next();
});
//match with google could and save google idtoken.
var matchGoogle = new function(IDToken,classNumber){
    userid = getUserIdByToken(IDToken);
    if(userid!=-1&&classroomList[classNUmber].studentlist.indexOf(userid)!=-1){
    console.log("student is inside class room");
        return true;
    }
    return false
}
//match student idtoken with the exsist IDTokenCash
var matchIDToken = new function(IDToken,classNumber){
    //classroom
if(!classroomList[classNumber])
    //classroom not exsist
    console.log("classroom not exsist");
    return {status:"error",reason:4};
    if(classroomList[classNumber].IDTokenCash.indexOf(IDToken)!=-1){
        console.log('your ID Token not in ID token cash');
        if(matchGoogle(IDToken,classNumber))
            return {status:'od'};
        return {status:'error',reason:2};
    }
}

//
//match classnumber
app.get('/:classNumber',function(req,res,next{
                                 if matchIDToken
                                  }));

app.get('/', function (req, res, next) {
    res.render('home-page');
});

app.post('/transaction_post',function(req,res,next){
         req.index
         });
app.post('/')
// create server
var httpServer = Http.createServer(app);
if(process.env.HTTPS_PORT){
    var privateKey  = Fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf8');
    var certificate = Fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf8');
    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = Https.createServer(credentials, app);
}

var soundClient = [];

// adding websocket server
function wsHandle(ws){
    var location = url.parse(ws.upgradeReq.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    if(location.path == '/sound-test-sender'){
        ws.on('message', function incoming(message) {
            console.log('message received, length:'+message.length);
            // console.log(message.toString());
            soundClient.forEach(function (client) {
                client.send(message);
            });
        });
    }else if(location.path == '/sound-test-receiver'){
        soundClient.push(ws);
        ws.on('close', function incoming() {
            soundClient.splice( soundClient.indexOf(ws), 1 );
        });
    }else{
        ws.on('message', function incoming(message) {
            var response = 'received: '+message.toString()+', from: ' + location.path;
            console.log(response);
            ws.send(response);
        });

        ws.send('something');
    }
}

wsServer = new WSWebSocket({server: httpServer});
wsServer.on('connection', wsHandle);
if(process.env.HTTPS_PORT){
    wsServer = new WSWebSocket({server: httpsServer});
    wsServer.on('connection', wsHandle);
}

// start up server
When.all(startupPromises).then(function () {
    var httpPort = process.env.HTTP_PORT || 3000;
    var httpsPort = process.env.HTTPS_PORT;
    httpServer.listen(httpPort);
    if(httpsPort){
        httpsServer.listen(httpsPort);
        console.log('https ready on '+httpsPort);
    }
    console.log('http ready on '+httpPort);
});