var args = require('minimist')(process.argv.slice(2), {
    string: ['port'],
    alias: {
        port: 'p'
    },
    default: {
        port: '6000'
    }
});


var express = require('express');
var morgan = require('morgan');
var app = express();

app.use(morgan('dev'));
app.use("/", express.static(__dirname + "/public"));
app.engine('jade', require('jade').__express);

var router = express.Router();

router.get('/', function(req, res) {
    return res.redirect('/photo');
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

app.use("/", router);

app.listen(parseInt(args.port), function() {
    console.log("listening on port", args.port);
});

