if(typeof window === 'undefined') {
    module.exports = require('./node-loaders');
}
else {
    module.exports = require('./web-loaders');
}
