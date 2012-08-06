
var lexer = require('lexer');

function Executioner() {

}



function parse(tokens) {
    var tok = tokens.nextToken();
}

module.exports = {
    parse: function(src) {
        return parse(lexer.lex(src));
    }
};
