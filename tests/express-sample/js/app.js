
require(['nunjucks-dev'], function(nunjucks) {
    var env = new nunjucks.Environment();
    env.render('index.html', function(err, res) {
        console.log('done!');
    });
});

