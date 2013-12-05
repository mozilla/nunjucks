var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var Loader = require('./loader');
var chokidar = require('chokidar');

// Node <0.7.1 compatibility
var existsSync = fs.existsSync || path.existsSync;

var FileSystemLoader = Loader.extend({
    init: function(searchPaths, noWatch) {
        this.pathsToNames = {};

        if(searchPaths) {
            searchPaths = lib.isArray(searchPaths) ? searchPaths : [searchPaths];
            // For windows, convert to forward slashes
            this.searchPaths = searchPaths.map(path.normalize);
        }
        else {
            this.searchPaths = ['.'];
        }

        if(!noWatch) {
            // Watch all the templates in the paths and fire an event when
            // they change
            lib.each(this.searchPaths, function(p) {
                if(existsSync(p)) {
                    var watcher = chokidar.watch(p, { ignoreInitial: true });

                    watcher.on("all", function(event, fullname) {
                        if(event == "change" && fullname in this.pathsToNames) {
                            this.emit('update', this.pathsToNames[fullname]);
                        }
                    }.bind(this));
                }
            }.bind(this));
        }
    },

    getSource: function(name) {
        var fullpath = null;
        var paths = this.searchPaths;

        for(var i=0; i<paths.length; i++) {
            var p = path.join(paths[i], name);

            // Only allow the current directory and anything
            // underneath it to be searched
            if((paths[i] == '.' || p.indexOf(paths[i]) === 0) &&
               existsSync(p)) {
                fullpath = p;
                break;
            }
        }

        if(!fullpath) {
            return null;
        }

        this.pathsToNames[fullpath] = name;

        return { src: fs.readFileSync(fullpath, 'utf-8'),
                 path: fullpath };
    }
});


module.exports = {
    FileSystemLoader: FileSystemLoader
};
