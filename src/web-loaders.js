
var Object = require('./object');

var HttpLoader = Object.extend({
    init: function(baseURL, neverUpdate) {
        console.log("[nunjucks] Warning: only use HttpLoader in " +
                    "development. Otherwise precompile your templates.");
        this.baseURL = baseURL || '';
        this.neverUpdate = neverUpdate;
    },

    getSource: function(name, callback) {
        var _this = this;

        this.fetch(this.baseURL + '/' + name, function(src) {
            if (!src) {
                return callback(null);
            }

            return { src:src,
                     path:name,
                     upToDate:function (cb) {
                         cb(_this.neverUpdate);
                     }};
        });
    },

    fetch: function(url, callback) {
        // Only in the browser please
        var ajax,
            loading = true;

        if (window.XMLHttpRequest) { // Mozilla, Safari, ...
            ajax = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE 8 and older
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4 && ajax.status == 200 && loading) {
                loading = false;
                callback(ajax.responseText);
            }
        };

        ajax.open('GET', url, true);
        ajax.send();
    }
});

module.exports = {
    HttpLoader: HttpLoader
};