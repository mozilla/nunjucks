var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './index.js',
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'nunjucks.js',
        library: true
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /loaders\.js$/,
            './web-loaders.js'
        ),
        new webpack.IgnorePlugin(/precompile/)
    ]
}
