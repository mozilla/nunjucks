if(typeof window === 'undefined' || window !== this) {
    module.exports = require('./node-loaders');
}
else {
    module.exports = require('./web-loaders');
}
