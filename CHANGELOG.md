
Changelog for versions previous to v0.1.9 are located at http://nunjucks.tumblr.com/.

# v0.1.9 (May 31, 2013)

* autoescaping ([docs](http://nunjucks.jlongster.com/api#Autoescaping))
* support for custom tags ([docs](http://nunjucks.jlongster.com/api#Custom-Tags-%2526-Extensions))
* the API for the `Environment` object changed slightly ([docs](http://nunjucks.jlongster.com/api#new-Environment%28%255Bloaders%255D%252C-%255Boptions%255D%29))
* tests now use expect.js instead of should.js, can be run [in the browser](http://jlongster.github.io/nunjucks/tests/browser/)!
* ternary conditional operator added (foo if bar else baz)
* various optimizations, comilation is now 1.4x faster
* fix too aggressive caching of templates from HTTP loader
* truncate filter has been added
* improve title filter
* many improvements to error messages
* add AMD support for precompiled templates
* fix multiple levels of super (issue #61)
* support passing a single file to nunjucks-precompile
* fix usage of `set` in an `if` block
* fixed passing a false-y value as the last argument to a macro
* `range`, `cycler`, and `joiner` globals have been added
* fix nested blocks
* add bower.json so the client-side lib can be installed through bower
