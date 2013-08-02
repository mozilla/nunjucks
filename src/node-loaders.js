var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var Object = require('./object');

// Node <0.7.1 compatibility
var exists = fs.existsSync || path.existsSync;

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

    getSource: function(name, callback) {
        var self = this;
        var paths = this.searchPaths.concat(['', __dirname]);
        var index = 0;

        var runExists = function(cb) {
            var p = path.join(paths[index], name);
            if (p.indexOf(paths[index]) === 0) {
                // template is in path
                var answer = exists(p);

                if (answer) {
                    // template found
                    cb(p);
                } else {
                    // template not found, move on
                    (++index < paths.length) ? runExists(cb) : cb(null);
                }
            } else {
                // template not in path, skip exists, move on
                (++index < paths.length) ? runExists(cb) : cb(null);
            }
        };

        runExists(function(fullpath) {
            if (!fullpath) {
                return callback(null);
            }

            lib.asyncParallel([
                function(done) {
                    self.upToDateFunc(fullpath, function (upToDate) {
                        done(upToDate);
                    });
                },
                function (done) {
                    // turn off async for now
                    done(fs.readFileSync(fullpath, 'utf-8'));

                    // fs.readFile(fullpath, 'utf-8', function (err, src) {
                    //     // todo: catch potential errors here
                    //     done(src);
                    // });
                }
            ], function(result) {
                callback({
                    src: result[1],
                    path: fullpath,
                    upToDate: result[0]
                });
            });
        });
    },

    upToDateFunc: function(file, callback) {
        callback(function(cb) { cb(false); });

        // fs.stat(file, function (err, stats) {
        //     // todo: catch potential errors here
        //     var mtime = stats.mtime.toString();

        //     callback(function (cb) {
        //         fs.stat(file, function (err, stats) {
        //             // todo: catch potential errors here
        //             cb(mtime === stats.mtime.toString());
        //         });
        //     });
        // });
    }
});


module.exports = {
    FileSystemLoader: FileSystemLoader
};
