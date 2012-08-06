
var template = require('template');
var parser = require('parser');
var fs = require('fs');

function Environment() {
}

Environment.prototype.get_template = function(name) {
    return new Template(fs.readFileAsync(name), this);
};

function Template(str, env) {
    this.str = str;
    this.env = env || Environment();
    this.tmpl_cache = null;
}

Template.prototype.render = function(ctx) {
    var tmpl;

    if(this.tmpl_cache) {
        tmpl = this.tmpl_cache;
    }
    else {
        tmpl = parser.parse(this.src);
        this.tmpl_cache = tmpl;
    }

    return tmpl.execute(ctx);
};
