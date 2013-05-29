
Changelog for versions previous to v0.1.9 are located at http://nunjucks.tumblr.com/.

# v0.1.9 (May 29, 2013)

* support for custom tags
* autoescaping
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
* tests now use expect.js instead of should.js, can be run [in the browser](http://jlongster.github.io/nunjucks/tests/browser/)!
* add bower.json so the client-side lib can be installed through bower
