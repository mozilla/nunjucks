(function() {
    var Environment, Template, loader, templatesPath;

    if(typeof require != 'undefined') {
        Environment = require('../src/environment').Environment;
        Template = require('../src/environment').Template;
        loader = require('../src/node-loaders').FileSystemLoader;
        templatesPath = 'tests/templates';
    }
    else {
        Environment = nunjucks.Environment;
        Template = nunjucks.Template;
        loader = nunjucks.HttpLoader;
        templatesPath = '../templates';
    }

    function render(str, ctx, opts) {
        opts = opts || { dev: true };
        var e = new Environment(new loader(templatesPath), opts);

        if(opts.filters) {
            for(var name in opts.filters) {
                e.addFilter(name, opts.filters[name]);
            }        
        }

        if(opts.extensions) {
            for(var name in opts.extensions) {
                e.addExtension(name, opts.extensions[name]);
            }
        }

        ctx = ctx || {};
        var t = new Template(str, e);
        return t.render(ctx);
    }

    if(typeof module != 'undefined') {
        module.exports.render = render;
    }
    else {
        window.render = render;
    }
})();
