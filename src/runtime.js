
var Object = require('./object');

// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
var Frame = Object.extend({
    init: function(parent) {
        this.variables = {};
        this.parent = parent;
    },

    addVariable: function(name, id) {
        this.variables[name] = id;
    },

    lookup: function(name) {
        var p = this.parent;
        return this.variables[name] || (p && p.lookup(name));
    },

    push: function() {
        return new Frame(this);
    }
});

module.exports.Frame = Frame;