
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var Object = require('./object');

var FileSystemLoader = Object.extend({
    init: function(searchPaths) {
        if(searchPaths) {
            this.searchPaths = _.isArray(searchPaths) ? searchPaths : [searchPaths];
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
            if(path.existsSync(p)) {
                fullpath = p;
                break;
            }
        }

        if(!fullpath) {
            return null;
        }

        return fs.readFileSync(fullpath, 'utf-8');
    }
});

module.exports = {
    FileSystemLoader: FileSystemLoader
};