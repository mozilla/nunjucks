var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;

var e = {};

e.isFunction = function(obj) {
    return ObjProto.toString.call(obj) == '[object Function]';
};

e.isArray = Array.isArray || function(obj) {
    return ObjProto.toString.call(obj) == '[object Array]';
};

e.isString = function(obj) {
    return ObjProto.toString.call(obj) == '[object String]';
};

e.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    for(var i=0; i<obj.length; i++) {
        var value = obj[i];
        var key = iterator(value, i);
        (result[key] || (result[key] = [])).push(value);
    }
    return result;
};

e.toArray = function(obj) {
    return Array.prototype.slice.call(obj);
};

e.without = function(array) {
    var result = [];
    if (!array) {
        return result;
    }
    var index = -1,
    length = array.length,
    contains = e.toArray(arguments).slice(1);

    while(++index < length) {
        if(contains.indexOf(array[index]) === -1) {
            result.push(array[index]);
        }
    }
    return result;
};

e.extend = function(obj, obj2) {
    for(var k in obj2) {
        obj[k] = obj2[k];
    }
    return obj;
};

e.repeat = function(char_, n) {
    var str = '';
    for(var i=0; i<n; i++) {
        str += char_;
    }
    return str;
};

e.map = function(obj, func) {
    var results = [];
    if(obj == null) {
        return results;
    }

    if(ArrayProto.map && obj.map === ArrayProto.map) {
        return obj.map(func);
    }
    
    for(var i=0; i<obj.length; i++) {
        results[results.length] = func(value, i);
    }

    if(obj.length === +obj.length) {
        results.length = obj.length;
    }

    return results;
};

module.exports = e;
