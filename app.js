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
    return res.render('index.jade');
});

fansRouter.get('/:resource/:id?', function(req, res) {
    resource = req.params.resource;
    id = req.params.id;
    
    return id ? res.redirect('/fans/#' + resource + '/' + id) : res.redirect('/fans/#' + resource);
});

/*fansRouter.get('/photo/:id?', function(req, res) {
    return res.render('index.jade');
});

fansRouter.get('/video', function(req, res) {
    return res.render('index.jade');
});

fansRouter.get('/news', function(req, res) {
    return res.redirect('/#news');
});

fansRouter.get('/news/:id?', function(req, res) {
    id = req.params.id;
    return res.redirect('/#news/' + id);
});
*/

//news center
app.use("/news/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var newsRouter = express.Router();

newsRouter.get('/', function(req, res) {
    return res.render('news.jade');
});

newsRouter.get('/:id?', function(req, res) {
    return res.render('news.jade');
});

//welfare center
app.use("/welfare/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var welfareRouter = express.Router();

welfareRouter.get('/', function(req, res) {
    return res.render('welfare.jade');
});

welfareRouter.get('/:id?', function(req, res) {
    return res.render('welfare.jade');
});

//favor center
app.use("/favor/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var favorRouter = express.Router();

favorRouter.get('/', function(req, res) {
    return res.render('favor.jade');
});

favorRouter.get('/:id?', function(req, res) {
    return res.render('favor.jade');
});

//prize center
app.use("/prize/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var prizeRouter = express.Router();

prizeRouter.get('/', function(req, res) {
    return res.render('prize.jade');
});

prizeRouter.get('/:id?', function(req, res) {
    return res.render('prize.jade');
});

//student center
app.use("/student/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var studentRouter = express.Router();

studentRouter.get('/', function(req, res) {
    return res.render('student.jade');
});

studentRouter.get('/bigpicture/:id?', function(req, res) {
    return res.render('student.jade');
});

studentRouter.get('/news/:id?', function(req, res) {
    return res.render('student.jade');
});

// proxy /contents/API/...
var apiRouter = express.Router();

apiRouter.get(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'wx.jdb.cn'
        },
        target: 'http://wx.jdb.cn/',
    });
});

apiRouter.post(/^\/contents\/API\/.*$/, function(req, res) {
    proxy.web(req, res, {
        headers: {
            host: 'wx.jdb.cn'
        },
        target: 'http://wx.jdb.cn/'
    });
});

app.use("/fans", fansRouter);
app.use("/news", newsRouter);
app.use("/welfare", welfareRouter);
app.use("/favor", favorRouter);
app.use("/prize", prizeRouter);
app.use("/student", studentRouter);
app.use("/", apiRouter);
app.get("/", function(req, res) {
    res.redirect('/fans');
});

app.listen(parseInt(args.port), function() {
    console.log("listening on port", args.port);
});
