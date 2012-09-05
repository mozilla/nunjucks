
var Object = require('./object');

var HttpLoader = Object.extend({
    init: function(baseURL) {
        console.log("[nunjucks] Warning: only use HttpLoader in " +
                    "development. Otherwise precompile your templates.");
        this.baseURL = baseURL || '';
    },

    getSource: function(name) {
        var src = this.fetch(this.baseURL + '/' + name);

        if(!src) {
            return null;
        }

        return { src: src,
                 path: name,
                 upToDate: function() { return false; }};
    },

    fetch: function(url) {
        // Only in the browser please
        var ajax = new XMLHttpRequest();
        var src = null;

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4 && ajax.status == 200) {
                src = ajax.responseText;
            }
        };

        // Synchronous because this API shouldn't be used in
        // production (pre-load compiled templates instead)
        ajax.open('GET', url, false);
        ajax.send();

        return src;
    }
});

module.exports = {
    HttpLoader: HttpLoader
};