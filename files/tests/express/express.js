'use strict';

var path     = require('path');
var express  = require('express');
var request  = require('supertest');
var nunjucks = require('../../');

var VIEWS = path.join(__dirname, '..', 'express-sample', 'views');

describe('express', function() {

    var app;
    var env;

    beforeEach(function() {
        app = express();
        env = new nunjucks.Environment(new nunjucks.FileSystemLoader(VIEWS));
        env.express(app);
    });

    it('should render a view with extension', function(done) {
        app.get('/', function(req, res) { res.render('about.html'); });
        request(app)
            .get('/')
            .expect(/This is just the about page/)
            .end(done);
    });

    it('should render a view without extension', function(done) {
        app.get('/', function(req, res) { res.render('about'); });
        app.set('view engine', 'html');
        request(app)
            .get('/')
            .expect(/This is just the about page/)
            .end(done);
    });
});
