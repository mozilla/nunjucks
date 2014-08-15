Changelog for versions previous to v0.1.9 are located at http://nunjucks.tumblr.com/.

# v1.0.6 (August 15, 2014)

* Added the `addGlobal` method to the Environment object
* import/extends/include now can take an arbitrary expression
* fix bugs in `set`
* improve express integration (allows rendering templates without an extension)

# v1.0.5 (May 1, 2014)

* Added support for browserify
* Added option to specify template output path when precompiling templates
* Keep version comment in browser minified files
* Speed up SafeString implementation
* Handle null and non-matching cases for word count filter
* Added support for node-webkit
* Other various minor bugfixes

# v1.0.4 (April 4, 2014)

* Use v0.8.2 of chokidar from NPM rather than Github

# v1.0.2 (March 25, 2014)

* Use chokidar for watching file changes. This should fix a lot of problems on OS X machines.
* Always use `/` in paths when precompiling templates
* Fix bug where async filters hang indefinitely inside `if` statements
* Extensions now can override autoescaping with an `autoescape` property
* Other various minor bugfixes

# v1.0.1 (December 16, 2013)

This is mostly bugfix and code cleanup release. The only added things are:

* New `nunjucks.compile` function which takes a string and returns a `Template` object
* The `urlize` filter has been added

# v1.0.0 (October 24, 2013)

We've hit 1.0! Thanks for helping nunjucks stabilize and become
awesome. I've added many good features recently and several people
have been using them, and everything seems stable. I think it's time
to cut 1.0.

## Big changes:

* An asynchronous API is now available, and async filters, extensions, and
  loaders is supported. The async API is optional and if you don't do
  anything async (the default), nothing changes for you. You can read
  more about this
  [here](http://jlongster.github.io/nunjucks/api.html#asynchronous-support). (fixes #41)
* Much simpler higher-level API for initiating/configuring nunjucks is
  available. Read more
  [here](http://jlongster.github.io/nunjucks/api.html#simple-api).
* An official grunt plugin is available for precompiling templates: [grunt-nunjucks](https://github.com/jlongster/grunt-nunjucks)
* **The browser files have been renamed**. nunjucks.js is now the full
    library with compiler, and nunjucks-slim.js is the small version
    that only works with precompiled templates

## Smaller changes:

* urlencode filter has been added
* The express integration has been refactored and isn't a kludge
  anymore. Should avoid some bugs and be more future-proof;
* The order in which variables are lookup up in the context and frame
  lookup has been reversed. It will now look in the frame first, and
  then the context. This means that if a `for` loop introduces a new
  var, like `{% for name in names %}`, and if you have `name` in the
  context as well, it will properly reference `name` from the for loop
  inside the loop. (fixes #122 and #119)

# v0.1.10 (August 9, 2013)

This is a minor version update that includes several bugfixes.

* fix hang when parsing an unclosed string that hits the end of file (fixes #85)
* Adds IE8 support
* `super()` calls are marked safe by default if using autoescaping
* exposed a `markSafe` function in the runtime module for marking strings as safe inside filters
* iterating over any "falsey" values will output nothing
* make "this" be the context object in filters (fixes #109)

# v0.1.9 (May 31, 2013)

* autoescaping ([docs](http://nunjucks.jlongster.com/api#Autoescaping))
* support for custom tags ([docs](http://nunjucks.jlongster.com/api#Custom-Tags-%2526-Extensions))
* the API for the `Environment` object changed slightly ([docs](http://nunjucks.jlongster.com/api#new-Environment%28%255Bloaders%255D%252C-%255Boptions%255D%29))
* tests now use expect.js instead of should.js, can be run [in the browser](http://jlongster.github.io/nunjucks/tests/browser/)!
* ternary conditional operator added (foo if bar else baz)
* various optimizations, compilation is now 1.4x faster
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
