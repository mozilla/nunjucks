'use strict';

var Loader = require('./loader');

var WebLoader = Loader.extend({
    init: function(baseURL, opts) {
        // It's easy to use precompiled templates: just include them
        // before you configure nunjucks and this will automatically
        // pick it up and use it
        this.precompiled = window.nunjucksPrecompiled || {};

        this.baseURL = baseURL || '';

        // By default, the cache is turned off because there's no way
        // to "watch" templates over HTTP, so they are re-downloaded
        // and compiled each time. (Remember, PRECOMPILE YOUR
        // TEMPLATES in production!)
        this.useCache = opts.useCache;
        this.async = opts.async;
    },

    getSource: function(name, cb) {
        if(this.precompiled[name]) {
            return {
                src: { type: 'code',
                       obj: this.precompiled[name] },
                path: name
            };
        }
        else {
            var useCache = this.useCache;
            var result;
            this.fetch(this.baseURL + '/' + name, function(err, src) {
                if(err) {
                    if(!cb) {
                        throw err;
                    }
                    cb(err);
                }
                else {
                    result = { src: src,
                               path: name,
                               noCache: !useCache };
                    if(cb) {
                        cb(null, result);
                    }
                }
            });

            // if this WebLoader isn't running asynchronously, the
            // fetch above would actually run sync and we'll have a
            // result here
            return result;
        }
    },

    fetch: function(url, cb) {
        // Only in the browser please
        var ajax;
        var loading = true;

        if(window.XMLHttpRequest) { // Mozilla, Safari, ...
            ajax = new XMLHttpRequest();
        }
        else if(window.ActiveXObject) { // IE 8 and older
            /* global ActiveXObject */
            ajax = new ActiveXObject('Microsoft.XMLHTTP');
        }

        ajax.onreadystatechange = function() {
            if(ajax.readyState === 4 && loading) {
                loading = false;
                if(ajax.status === 0 || ajax.status === 200) {
                    cb(null, ajax.responseText);
                }
                else {
                    cb(ajax.responseText);
                }
            }
        };

        url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
               (new Date().getTime());

        ajax.open('GET', url, this.async);
        ajax.send();
    }
});

module.exports = {
    WebLoader: WebLoader
};
