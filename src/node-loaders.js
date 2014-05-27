var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var Loader = require('./loader');
var chokidar = require('chokidar');

// Node <0.7.1 compatibility
var existsSync = fs.existsSync || path.existsSync;

var FileSystemLoader = Loader.extend({
    init: function(searchPaths, noWatch, defaultExt) {
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

        // set defaultExt in format of '.ext' if passed, otherwise use '.html'
        defaultExt = (typeof(defaultExt) === 'string' && defaultExt.length) ? defaultExt : '.html';
        defaultExt = defaultExt[0] === '.' ? defaultExt : '.'.concat(defaultExt);
        this.defaultExt = defaultExt;

    },

    getSource: function(name) {
        var fullpath = null;
        var paths = this.searchPaths;

        for(var i=0; i<paths.length; i++) {
            var p = [
                path.join(paths[i], name),
                path.join(paths[i], name + this.defaultExt)
            ];

            var test = function(path) {
                // Only allow the current directory and anything
                // underneath it to be searched
                if (paths[i] == '.' || path.indexOf(paths[i] === 0)
                    && existsSync(path)) {
                        return path;
                }
                return null;
            };

            // Test both name AND name + defaultExt for exists match
            fullpath = lib.firstof(p, test);
            if(fullpath) { break; }
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
