var nunjucks = require('../../index');
var express = require('express');

var app = express();
nunjucks.configure('views', { autoescape: true,
                              express: app,
                              watch: true });

// app

app.use(express.static(__dirname));

app.use(function(req, res, next) {
    res.locals.user = 'hello';
    next();
});

app.get('/', function(req, res) {
    res.render('index.j2', { username: 'James Long <strong>copyright</strong>' });
});

app.get('/about', function(req, res) {
    res.render('about.j2');
});

app.listen(4000);
