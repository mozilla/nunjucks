
nunjucks.configure({ autoescape: true });

aboutTmpl({ poop: 'pooop<><>' }, function(err, res) {
    console.log(res);
});

