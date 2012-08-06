
var util = require('util');

var whitespaceChars = " \n\t\r";
var delimChars = "()[]{}%*-+/#";
var integerRe = /^[-+]?[0-9]+/;

var BLOCK_START = "{%";
var BLOCK_END = "%}";
var VARIABLE_START = "{{";
var VARIABLE_END = "}}";
var COMMENT_START = "{#";
var COMMENT_END = "#}";

var TOKEN_STRING = "string";
var TOKEN_WHITESPACE = "whitespace";
var TOKEN_DATA = "data";
var TOKEN_BLOCK_START = "block-start";
var TOKEN_BLOCK_END = "block-end";
var TOKEN_VARIABLE_START = "variable-start";
var TOKEN_VARIABLE_END = "variable-end";
var TOKEN_COMMENT_START = "comment-start";
var TOKEN_COMMENT_END = "comment-end";
var TOKEN_INT = "int";
var TOKEN_FLOAT = "float";
var TOKEN_BOOLEAN = "boolean";
var TOKEN_SYMBOL = "symbol";
var TOKEN_SPECIAL = "special";

function Tokenizer(str) {
    this.str = str;
    this.index = 0;
    this.len = str.length;
    this.lineno = 0;
    this.colno = 0;

    this.in_code = false;
}

Tokenizer.prototype.nextToken = function() {
    var lineno = this.lineno;
    var colno = this.colno;
    var whitespace = this._extract(whitespaceChars);

    if(whitespace) {
        // First, check for whitespace
        return [TOKEN_WHITESPACE, whitespace, lineno, colno];
    }
    else if(this.in_code) {
        // Otherwise, if we are in a block parse it as code
        var cur = this.current();
        var tok;

        if(this.is_finished()) {
            // We have nothing else to parse
            return null;
        }
        else if(cur == '"') {
            // We've hit a string
            return [TOKEN_STRING, this.parseString(), lineno, colno];
        }
        else if((tok = this._extractString(BLOCK_END))) {
            // Special check for the block end tag
            //
            // It is a requirement that start and end tags are composed of
            // delimiter characters (%{}[] etc), and our code always
            // breaks on delimiters so we can assume the token parsing
            // doesn't consume these elsewhere
            this.in_code = false;
            return [TOKEN_BLOCK_END, tok, lineno, colno];
        }
        else if((tok = this._extractString(VARIABLE_END))) {
            // Special check for variable end tag (see above)
            this.in_code = false;
            return [TOKEN_VARIABLE_END, tok, lineno, colno];
        }
        else if(delimChars.indexOf(cur) != -1) {
            // We've hit a delimiter (a special char like a bracket)
            this.forward();
            return [TOKEN_SPECIAL, cur, lineno, colno];
        }
        else {
            // We are not at whitespace or a delimiter, so extract the
            // text and parse it
            tok = this._extractUntil(whitespaceChars + delimChars);

            if(tok.match(/^[-+]?[0-9]+\\.[0-9]*$/)) {
                return [TOKEN_FLOAT, tok, lineno, colno];
            }
            else if(tok.match(/^[-+]?[0-9]+$/)) {
                return [TOKEN_INT, tok, lineno, colno];
            }
            else if(tok.match(/^(true|false)$/)) {
                return [TOKEN_BOOLEAN, tok, lineno, colno];
            }
            else if(tok) {
                return [TOKEN_SYMBOL, tok, lineno, colno];
            }
            else {
                throw new Error("Unexpected value while parsing: " + tok);
            }
        }
    }
    else {
        // Lastly, parse out the template text, breaking on tag
        // delimiters because we need to look for block/variable start
        // tags
        var beginChars = BLOCK_START[0] + VARIABLE_START[0] + COMMENT_START[0];
        var tok;

        if(this.is_finished()) {
            return null;
        }
        else if((tok = this._extractString(BLOCK_START))) {
            this.in_code = true;
            return [TOKEN_BLOCK_START, tok, lineno, colno];
        }
        else if((tok = this._extractString(VARIABLE_START))) {
            this.in_code = true;
            return [TOKEN_VARIABLE_START, tok, lineno, colno];
        }
        else if((tok = this._extractString(COMMENT_START))) {
            return [TOKEN_COMMENT_START, tok, lineno, colno];
        }
        else if((tok = this._extractString(COMMENT_END))) {
            return [TOKEN_COMMENT_END, tok, lineno, colno];
        }
        else {
            tok = "";
            var data;

            // Continually consume text, breaking on the tag delimiter
            // characters and checking to see if it's a start tag.
            //
            // We could hit the end of the template in the middle of
            // our looping, so check for the null return value from
            // _extractUntil
            while((data = this._extractUntil(beginChars)) !== null) {
                tok += data;

                if(this._matches(BLOCK_START) ||
                   this._matches(VARIABLE_START) ||
                   this._matches(COMMENT_START)) {
                    // If it is a start tag, stop looping
                    break;
                }
                else {
                    // It is not a start tag, so add the character and
                    // continue on
                    tok += this.current();
                    this.forward();
                }
            }

            return [TOKEN_DATA, tok, lineno, colno];
        }
    }

    throw new Error("Could not parse text");
};

Tokenizer.prototype.parseString = function() {
};

Tokenizer.prototype._matches = function(str) {
    if(this.index + str.length > this.length) {
        return null;
    }

    var m = this.str.slice(this.index, this.index + str.length);
    return m == str;
};

Tokenizer.prototype._extractString = function(str) {
    if(this._matches(str)) {
        this.index += str.length;
        return str;
    }
    return null;
};

Tokenizer.prototype._extractUntil = function(charString) {
    // Extract all non-matching chars, with the default matching set
    // to everything
    return this._extractMatching(true, charString || "");
};

Tokenizer.prototype._extract = function(charString) {
    // Extract all matching chars (no default, so charString must be
    // explicit)
    return this._extractMatching(false, charString);
};

Tokenizer.prototype._extractMatching = function (breakOnMatch, charString) {
    // Pull out characters until a breaking char is hit.
    // If breakOnMatch is false, a non-matching char stops it.
    // If breakOnMatch is true, a matching char stops it.

    if(this.is_finished()) {
        return null;
    }

    var first = charString.indexOf(this.current());

    // Only proceed if the first character doesn't meet our condition
    if((breakOnMatch && first == -1) ||
       (!breakOnMatch && first != -1)) {
        var t = this.current();
        this.forward();

        // And pull out all the chars one at a time until we hit a
        // breaking char
        var idx = charString.indexOf(this.current());

        while(((breakOnMatch && idx == -1) ||
               (!breakOnMatch && idx != -1)) && !this.is_finished()) {
            t += this.current();
            this.forward();

            idx = charString.indexOf(this.current());
        }

        return t;
    }

    return "";
};

Tokenizer.prototype.is_finished = function() {
    return this.index >= this.len;
};

Tokenizer.prototype.forwardN = function(n) {
    for(var i=0; i<n; i++) {
        this.forward();
    }
};

Tokenizer.prototype.forward = function() {
    this.index++;

    if(this.previous() == "\n") {
        this.lineno++;
        this.colno = 0;
    }
    else {
        this.colno++;
    }
};

Tokenizer.prototype.backN = function(n) {
    for(var i=0; i<n; i++) {
        self.back();
    }
};

Tokenizer.prototype.back = function() {
    this.index--;

    if(this.current() == "\n") {
        this.lineno--;

        var idx = this.src.lastIndexOf("\n", this.index-1);
        if(idx == -1) {
            this.colno = this.index;
        }
        else {
            this.colno = this.index - idx;
        }
    }
    else {
        this.colno--;
    }
};

Tokenizer.prototype.current = function() {
    if(!this.is_finished()) {
        return this.str[this.index];
    }
    return "";
};

Tokenizer.prototype.previous = function() {
    return this.str[this.index-1];
};

module.exports = {
    lex: function(src) {
        return new Tokenizer(src);
    }
};