
require(['nunjucks-dev'], function(nunjucks) {
    nunjucks.env = new nunjucks.Environment(new nunjucks.HttpLoader('/views'));
    nunjucks.env.addExtension('RemoteExtension', new RemoteExtension());

});
