
require(['nunjucks'], function(nunjucks) {
    if(!nunjucks.env) {
        nunjucks.env = new nunjucks.Environment({ precompiled: '/js/nunjucks-precompiled.js',
                                                  loader: new nunjucks.HttpLoader('/views') });
    }

    alert(nunjucks.env.render('index.html'));
});
