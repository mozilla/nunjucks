var nunjucks = require('../../index');
var express = require('express');

var app = express();
nunjucks.configure('views', { autoescape: true,
                              express: app });

// app

app.use(express.static(__dirname));

app.use(function(req, res, next) {
    res.locals.user = 'hello';
    next();
});

app.get('/', function(req, res) {
    res.render('index.html', { username: 'James Long <strong>copyright</strong>' });
});

app.get('/about', function(req, res) {
    res.render('about.html');
});

app.listen(4000);
