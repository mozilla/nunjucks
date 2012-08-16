
var env = require('../src/environment');
var loaders = require('../src/loaders');
var express = require('express');

var app = express();

var e = new env.Environment(new loaders.FileSystemLoader('templates'));
e.express(app);

app.get('/', function(req, res) {
    res.render('index.html', { username: 'James Long' });
});

app.get('/about', function(req, res) {
    res.render('about.html');
});

app.listen(4000);