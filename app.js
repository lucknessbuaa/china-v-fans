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

var fansRouter = express.Router();

fansRouter.get('/', function(req, res) {
    return res.redirect('photo');
});

fansRouter.get('/photo/:id?', function(req, res) {
    return res.render('index.jade');
});

fansRouter.get('/video', function(req, res) {
    return res.render('index.jade');
});

fansRouter.get('/news', function(req, res) {
    return res.render('index.jade');
});

// proxy /contents/API/...
var apiRouter = express.Router();

apiRouter.get(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'contents.jarvys.me'
        },
        target: 'http://contents.jarvys.me',
    });
});

apiRouter.post(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'contents.jarvys.me'
        },
        target: 'http://contents.jarvys.me',
    });
});

app.use("/fans", fansRouter);
app.use("/", apiRouter);
app.get("/", function(req, res) {
    res.redirect('/fans');
});

app.listen(parseInt(args.port), function() {
    console.log("listening on port", args.port);
});
