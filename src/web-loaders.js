var Loader = require('./loader');

var HttpLoader = Loader.extend({
    init: function(baseURL, neverUpdate) {
        if (typeof(console) !== "undefined" && console.log &&
            typeof(nunjucks) == "object" && !nunjucks.testing) {
          console.log("[nunjucks] Warning: only use HttpLoader in " +
                      "development. Otherwise precompile your templates.");
        }
        this.baseURL = baseURL || '';
        this.neverUpdate = neverUpdate;
    },

    getSource: function(name, callback) {
        var src = this.fetch(this.baseURL + '/' + name);

        if (!src) {
            return null;
        }

        return { src: src,
                 path: name };
    },

    fetch: function(url, callback) {
        // Only in the browser please
        var ajax;
        var loading = true;
        var src;

        if (window.XMLHttpRequest) { // Mozilla, Safari, ...
            ajax = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE 8 and older
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4 && ajax.status == 200 && loading) {
                loading = false;
                src = ajax.responseText;
            }
        };

        url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' + 
               (new Date().getTime());

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
