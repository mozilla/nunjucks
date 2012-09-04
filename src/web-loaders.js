
var Object = require('./object');

var HTTPLoader = Object.extend({
    init: function(baseURL) {
        this.baseURL = baseURL;
    },

    getSource: function(name) {
        this.fetch(name, function(r, status) {
            console.log(r, status);
        });
    },

    fetch: function(url, k) {
        // Only in the browser please
        var ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4) {
                k(ajax.responseText, ajax.status);
            }
        };

        ajax.open('GET', url, true);
        ajax.send();
    }
});

// var PrecompiledLoader = Object.extend({
    
// });

module.exports = {
    HTTPLoader: HTTPLoader
};