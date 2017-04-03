const ChildProcess = require('child_process');
const Os = require('os');
var npmResult;
if(Os.platform() == 'win32'){
    npmResult = ChildProcess.spawnSync('npm.cmd', ['install'], {stdio: 'inherit'});
}else{
    npmResult = ChildProcess.spawnSync('npm', ['install'], {stdio: 'inherit'});
}
if(npmResult.status != 0){
    console.error('modules install failed, app.js cannot proceed. exiting...');
    process.exit(1);
}

global.log = require('./modules/logging');var Express = require('express');
var Http = require('http');
var Https = require('https');
var CookieParser = require('cookie-parser');
var Helmet = require('helmet');
var Mongodb = require('mongodb');
var When = require('when');
var Ejs = require('ejs');
var Fs = require('fs');
var WSWebSocket = require("ws").Server;

var WSHandle = require('./modules/websocket');
var Tools = require('./tools.js');
var readyList = [];
global.s = {
    wsHandler: new WSHandle.WSHandler(),
    mongodb: Mongodb,
    dbPath: process.env.DB_PATH || 'mongodb://localhost:27017/',
    googleLoginTool: require('./modules/google_login'),
    inProduction: process.env.NODE_ENV === 'production',
};
s.transactionRecord = require('./database/transaction_record.js');
s.transactionRecord.initDatabase(readyList);

s.sessionManager = require('./modules/sessionManager');

var app = Express();

app.use(Helmet());
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
            res.status(403).send("google login failed");
        });
    } else next();
});
app.use('/', require('./modules/rest').getRoute(s));

// ---------------error handling section ---------------
// 404 error
app.all('*', function (req, res, next) {
    res.status(404).send("404 NOT FOUND");
});
// default error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("500 SERVER ERROR");
});

// create server
var httpServer = Http.createServer(app);
if (process.env.HTTPS_PORT) {
    var privateKey = Fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf8');
    var certificate = Fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf8');
    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = Https.createServer(credentials, app);
}

wsServer = new WSWebSocket({server: httpServer});
wsServer.on('connection', s.wsHandler.handle);
if (process.env.HTTPS_PORT) {
    wsServer = new WSWebSocket({server: httpsServer});
    wsServer.on('connection', s.wsHandler.handle);
}

// start up server
When.all(readyList)
    .then(s.sessionManager.initSession)
    .then(function () {
        var httpPort = process.env.HTTP_PORT || 3000;
        var httpsPort = process.env.HTTPS_PORT;
        httpServer.listen(httpPort);
        if (httpsPort) {
            httpsServer.listen(httpsPort);
            console.log('https ready on ' + httpsPort);
        }
        console.log('http ready on ' + httpPort);
    });