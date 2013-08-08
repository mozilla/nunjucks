
nunjucks.configure('/views');

nunjucks.render('index.html', function(err, res) {
    console.log('done!');
});
