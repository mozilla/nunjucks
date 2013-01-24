var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var Object = require('./object');

// Node <0.7.1 compatibility
var existsSync = fs.existsSync ? fs.existsSync : path.existsSync;

var FileSystemLoader = Object.extend({
    init: function(searchPaths) {
        if(searchPaths) {
            searchPaths = lib.isArray(searchPaths) ? searchPaths : [searchPaths];
            // For windows, convert to forward slashes
            this.searchPaths = searchPaths.map(path.normalize);
        }
        else {
            this.searchPaths = [];
        }

    },

    getSource: function(name) {
        var fullpath = null;
        var paths = this.searchPaths.concat(['', __dirname]);
        for(var i=0; i<paths.length; i++) {
            var p = path.join(paths[i], name);
            if(p.indexOf(paths[i]) === 0 && existsSync(p)) {
                fullpath = p;
                break;
            }
        }

        if(!fullpath) {
            return null;
        }

        return { src: fs.readFileSync(fullpath, 'utf-8'),
                 path: fullpath,
                 upToDate: this.upToDateFunc(fullpath) };
    },

    upToDateFunc: function(file) {
        var mtime = fs.statSync(file).mtime.toString();
        return function() {
            return fs.statSync(file).mtime.toString() == mtime;
        };
    }
});


module.exports = {
    FileSystemLoader: FileSystemLoader
};
