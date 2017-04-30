const ChildProcess = require('child_process');
const Os = require('os');

var npmResult;
if(Os.platform() == 'win32'){
    npmResult = ChildProcess.spawnSync('npm.cmd', ['install'], {stdio: 'inherit'});
}else{
    npmResult = ChildProcess.spawnSync('npm', ['install'], {stdio: 'inherit'});
}
if(npmResult.status != 0){
    console.error('live_modules install failed, app.js cannot proceed. exiting...');
    process.exit(1);
}

global.log = require('./live_modules/logging');var Express = require('express');
const Http = require('http');
const Https = require('https');
const CookieParser = require('cookie-parser');
const Helmet = require('helmet');
const Mongodb = require('mongodb');
const When = require('when');
const Ejs = require('ejs');
const Fs = require('fs');
const WSWebSocket = require("ws").Server;
const Validator = require("better-validator");
const Request = require("request");

const validator = new Validator();

var WSHandle = require('./live_modules/websocket');
var Tools = require('./tools.js');
var readyList = [];
global.s = {
    wsHandler: new WSHandle.WSHandler(),
    mongodb: Mongodb,
    dbPath: process.env.DB_PATH || 'mongodb://localhost:27017/',
    googleLoginTool: require('./live_modules/google_login'),
    inProduction: process.env.NODE_ENV === 'production',
    googleLoginClientID: process.env.GOOGLE_LOGIN_CLIENT_ID,
    role: process.env.ROLE,
    classConn: null,
    userConn: null,
};
s.tools = Tools.getToolSet(s);
if(s.role == 'support'){
    s.userConn = require('./database/user_db');
    s.userConn.initDatabase(readyList);
    s.classConn = require('./database/class_db');
    s.classConn.initDatabase(readyList);
    s.resourceConn = require('./database/resource_db');
    s.resourceConn.initDatabase(readyList)
}else if(s.role == 'live'){
    s.transactionRecord = require('./database/transaction_record.js');
    s.transactionRecord.initDatabase(readyList);
}

s.sessionManager = require('./live_modules/sessionManager');

var app = Express();

app.use(Helmet({hsts:false}));
app.use('/static', Express.static(__dirname + '/static'));
app.use(CookieParser());
app.set('view engine', 'ejs');
if(!s.inProduction){
    app.use((req, res, next)=> {
        log.debug("visited: " + req.originalUrl);
        next();
    });
}
app.use(function (req, res, next) {
    req.userLoginInfo = null;
    res.locals.userLoginInfo = null;
    if (typeof req.cookies.IDToken == 'string') {
        s.googleLoginTool.getUserInfo(req.cookies.IDToken).then((userInfo)=> {
            req.userLoginInfo = userInfo;
            res.locals.userLoginInfo = userInfo;
            next();
        }).catch((err)=> {
            res.status(403).send("google login failed: "+(err.message?err.message:"unknown error"));
        });
    } else next();
});

if(s.role == 'support'){
    app.use((req, res, next)=>{
        if(!req.userLoginInfo) return next();
        s.userConn.getUserByEmail(req.userLoginInfo.email).then((record)=>{
            if(!record){ // user is not in database
                s.userConn.addUser(req.userLoginInfo.userID, req.userLoginInfo.email, null, req.userLoginInfo.name).then(()=>next()).catch(()=>{
                    res.status(400).send('database error (89)');
                });
                req.userLoginInfo.record = {googleID: req.userLoginInfo.userID, email: req.userLoginInfo.email, username: req.userLoginInfo.name};
            }else if(validator(record, s.userConn.basicUserInfoRule).length == 0){ // user has complete info
                req.userLoginInfo.record = record;
                next();
            }else{// user info is incomplete
                req.userLoginInfo.record = {googleID: req.userLoginInfo.userID, email: req.userLoginInfo.email, username: req.userLoginInfo.name};
                s.userConn.setUserInfo(req.userLoginInfo.userID, req.userLoginInfo.record).then(()=>next()).catch((err)=>{
                    res.status(400).send('database error (96)');
                });
            }
        });
    });
}else if(s.role == 'live'){
    app.use((req, res, next)=>{
        if(!req.userLoginInfo) return next();
        Request({
            method: 'GET',
            json: true,
            url:(s.inProduction?"https":"http")+"://recilive.stream/ajax/live-get-user-info?id="+encodeURIComponent(req.userLoginInfo.userID),
        }, (error, response, body)=>{
            if(error) return res.status(500).send('login info cannot be verified');
            req.userLoginInfo.userID = body._id;
            req.userLoginInfo.record = body;
            return next();
        });
    });
}

// ---------------all available role section -----------
if(s.role == 'support') app.use('/', require('./support_routes').getRoute(s));
else if(s.role == 'live') app.use('/', require('./live_modules/rest').getRoute(s));
else console.error('WARNING: no role assigned');

// ---------------error handling section ---------------
// 404 error
app.all('*', function (req, res, next) {
    res.status(404).send("404 NOT FOUND");
});
// default error handling
app.use(function (err, req, res, next) {
    console.error(err.stack || err);
    res.status(500).send("500 SERVER ERROR");
});

// create server
var httpServer = Http.createServer(app);
if (process.env.HTTPS_PORT) {
    try{
        var privateKey = Fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf8');
        var certificate = Fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf8');
        var credentials = {key: privateKey, cert: certificate};
        var httpsServer = Https.createServer(credentials, app);
    }catch(e){
        console.error(e);
        console.error('fail to read essential https files');
        delete process.env.HTTPS_PORT;
    }
}

wsServer = new WSWebSocket({server: httpServer});
wsServer.on('connection', s.wsHandler.handle);
if (process.env.HTTPS_PORT) {
    wsServer = new WSWebSocket({server: httpsServer});
    wsServer.on('connection', s.wsHandler.handle);
}

// start up server
if (s.role == 'support'){
    When.all(readyList).then(function () {
        var httpPort = process.env.HTTP_PORT || 3000;
        var httpsPort = process.env.HTTPS_PORT;
        httpServer.listen(httpPort);
        if (httpsPort) {
            httpsServer.listen(httpsPort);
            console.log('https ready on ' + httpsPort);
        }
        console.log('http ready on ' + httpPort);
    });
} else if (s.role == 'live'){
    When.all(readyList).then(s.sessionManager.initSession).then(function () {
        var httpPort = process.env.HTTP_PORT || 3000;
        var httpsPort = process.env.HTTPS_PORT;
        httpServer.listen(httpPort);
        if (httpsPort) {
            httpsServer.listen(httpsPort);
            console.log('https ready on ' + httpsPort);
        }
        console.log('http ready on ' + httpPort);
    });
} else {
    console.error('WARNING: no role assigned');
}
