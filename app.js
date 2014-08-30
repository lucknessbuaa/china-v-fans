var args = require('minimist')(process.argv.slice(2), {
    string: ['port'],
    alias: {
        port: 'p'
    },
    default: {
        port: '9758'
    }
});


var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();
proxy.on('error', function(e) {
    console.error(e);
});

var express = require('express');
var morgan = require('morgan');
var app = express();

app.use(morgan('dev'));
app.use("/fans/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var router = express.Router();

router.get('/', function(req, res) {
    return res.redirect('photo');
});

router.get('/photo/:id?', function(req, res) {
    return res.render('index.jade');
});

router.get('/video', function(req, res) {
    return res.render('index.jade');
});

router.get('/news', function(req, res) {
    return res.render('index.jade');
});

app.use("/fans", router);

// proxy /contents/API/...
app.get(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'contents.jarvys.me'
        },
        target: 'http://contents.jarvys.me/contents/',
    });
});

app.post(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'contents.jarvys.me'
        },
        target: 'http://contents.jarvys.me',
    });
});

app.listen(parseInt(args.port), function() {
    console.log("listening on port", args.port);
});
