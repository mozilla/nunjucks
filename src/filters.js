
var _ = require('underscore');

function repeat(char_, n) {
    var str = '';
    for(var i=0; i<n; i++) {
        str += char_;
    }
    return str;
}

var filters = {
    abs: function(n) {
        return Math.abs(n);
    },

    batch: function(arr, linecount, fill_with) {
        var res = [];
        var tmp = [];

        for(var i=0; i<arr.length; i++) {
            if(i % linecount === 0 && tmp.length) {
                res.push(tmp);
                tmp = [];
            }

            tmp.push(arr[i]);
        }

        if(tmp.length) {
            if(fill_with) {
                for(var i=tmp.length; i<linecount; i++) {
                    tmp.push(fill_with);
                }
            }

            res.push(tmp);
        }

        return res;
    },

    capitalize: function(str) {
        str = str.toLowerCase();
        return str[0].toUpperCase() + str.slice(1);
    },

    center: function(str, width) {
        width = width || 80;

        if(str.length >= width) {
            return str;
        }

        var spaces = width - str.length;
        var pre = repeat(" ", spaces/2 - spaces % 2);
        var post = repeat(" ", spaces/2);
        return pre + str + post;
    },

    default: function(val, def) {
        return val ? val : def;
    },

    dictsort: function(dict, caseSens, by) {
        by = by || 'key';
    },

    escape: function(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    filesizeformat: function(val, binary) {
    },

    first: function(arr) {
        return arr[0];
    },

    forceescape: function(val) {

    },

    format: function(str /*, vals */) {
        var args = _.toArray(arguments).slice(1);
    },

    groupby: function(arr, attr) {
        return _.groupBy(arr, attr);
    },

    indent: function(str, width, indentfirst) {
        width = width || 4;
    },

    join: function(val, d, attr) {
        d = d || '';
    },

    last: function(arr) {
    },

    length: function(arr) {
        return arr.length;
    },

    list: function(val) {
    },

    lower: function(str) {
    },

    pprint: function(val) {
    },

    random: function(arr) {
    },

    replace: function(str, old, new_, count) {
    },

    reverse: function(str) {
    },

    round: function(val, precision, method) {
        method = method || 'common';
    },

    safe: function(str) {
    },

    slice: function(arr, slices, fillWith) {
    },

    sort: function(arr, reverse, caseSens, attr) {
    },

    string: function(obj) {
        return obj.toString();
    },

    striptags: function(val) {
    },

    sum: function(arr, attr, start) {
    },
    
    title: function(str) {
        return str.toUpperCase();
    },

    trim: function(str) {

    },

    truncate: function(str, length, killWords, end) {
        length = length || 255;
        end = end || '...';
    },

    upper: function(str) {
        return str.toUpperCase();
    },

    urlize: function(str, trimLimit, noFollow) {
    },

    wordcount: function(str) {
    },

    wordwrap: function(str, width, breakWords) {
        width = width || 79;
    },

    xmlattr: function(dict, autospace) {
    },

    float: function(val, def) {
    },
    
    int: function(val, def) {
    },
};

// Aliases
filters.d = filters.default;
filters.e = filters.escape;

module.exports = filters;