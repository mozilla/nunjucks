
var env = require('../../src/environment');
var loaders = require('../../src/node-loaders');
var express = require('express');

var app = express.createServer();

var e = new env.Environment(new loaders.FileSystemLoader('views'));
e.express(app);

app.use(express.static(__dirname));

app.use(function(req, res, next) {
    res.locals.user = 'hello';
    next();
});

app.get('/', function(req, res) {
    res.render('index.html', { username: 'James Long' });
});

app.get('/about', function(req, res) {
    res.render('about.html');
});

app.listen(4000);