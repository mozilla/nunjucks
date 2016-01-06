Changelog
=========

v2.3.0 (Jan 6 2016)
-------------------

* Return `null` from `WebLoader` on missing template instead of throwing an
  error, for consistency with other loaders. This allows `WebLoader` to support
  the new `ignore missing` flag on the `include` tag. If `ignore missing` is
  not set, a generic "template not found" error will still be thrown, just like
  for any other loader. Ajax errors other than 404 will still cause `WebLoader`
  to throw an error directly.

* Add preserve-linebreaks option to `striptags` filter. Thanks Ivan
  Kleshnin. Merge of [#619](https://github.com/mozilla/nunjucks/pull/619).


v2.2.0 (Nov 23 2015)
--------------------

* Add `striptags` filter. Thanks Anthony Giniers. Merge of
  [#589](https://github.com/mozilla/nunjucks/pull/589).
* Allow compiled templates to be imported, included and extended. Thanks Luis
  Gutierrez-Sheris. Merge of
  [#581](https://github.com/mozilla/nunjucks/pull/581).
* Fix issue with different nunjucks environments sharing same globals. Each
  environment is now independent.  Thanks Paul Pechin. Merge of
  [#574](https://github.com/mozilla/nunjucks/pull/574).
* Add negative steps support for range function. Thanks Nikita Mostovoy. Merge
  of [#575](https://github.com/mozilla/nunjucks/pull/575).
* Remove deprecation warning when using the `default` filter without specifying
  a third argument. Merge of
  [#567](https://github.com/mozilla/nunjucks/pull/567).
* Add support for chaining of addGlobal, addFilter, etc. Thanks Rob Graeber. Merge of
  [#537](https://github.com/mozilla/nunjucks/pull/537)
* Fix error propagation. Thanks Tom Delmas. Merge of
  [#534](https://github.com/mozilla/nunjucks/pull/534).
* trimBlocks now also trims windows style line endings. Thanks Magnus Tovslid. Merge of
  [#548](https://github.com/mozilla/nunjucks/pull/548)
* `include` now supports an option to suppress errors if the template does not
  exist. Thanks Mathias Nestler. Merge of
  [#559](https://github.com/mozilla/nunjucks/pull/559)


v2.1.0 (Sep 21 2015)
--------------------

* Fix creating `WebLoader` without `opts`. Merge of
  [#524](https://github.com/mozilla/nunjucks/pull/524).
* Add `hasExtension` and `removeExtension` methods to `Environment`. Merge of
  [#512](https://github.com/mozilla/nunjucks/pull/512).
* Add support for kwargs in `sort` filter. Merge of
  [#510](https://github.com/mozilla/nunjucks/pull/510).
* Add `none` as a lexed constant evaluating to `null`. Merge of
  [#480](https://github.com/mozilla/nunjucks/pull/480).
* Fix rendering of multiple `raw` blocks. Thanks Aaron O'Mullan. Merge of
  [#503](https://github.com/mozilla/nunjucks/pull/503).
* Avoid crashing on async loader error. Thanks Samy Pessé. Merge of
  [#504](https://github.com/mozilla/nunjucks/pull/504).
* Add support for keyword arguments for sort filter. Thanks Andres Pardini. Merge of
  [#510](https://github.com/mozilla/nunjucks/pull/510)


v2.0.0 (Aug 30 2015)
--------------------

Most of the changes can be summed up in the
[issues tagged 2.0](https://github.com/mozilla/nunjucks/issues?q=is%3Aissue+milestone%3A2.0+is%3Aclosed).

Or you can
[see all commits](https://github.com/mozilla/nunjucks/compare/v1.3.4...f8aabccefc31a9ffaccdc6797938b5187e07ea87).

Most important changes:

* **autoescape is now on by default.** You need to explicitly pass `{
  autoescape: false }` in the options to turn it off.
* **watch is off by default.** You need to explicitly pass `{ watch: true }` to
  start the watcher.
* The `default` filter has changed. It will show the default value only if the
  argument is **undefined**. Any other value, even false-y values like `false`
  and `null`, will be returned. You can get back the old behavior by passing
  `true` as a 3rd argument to activate the loose-y behavior: `foo |
  default("bar", true)`. In 2.0 if you don't pass the 3rd argument, a warning
  will be displayed about this change in behavior. In 2.1 this warning will be
  removed.
* [New filter tag](http://mozilla.github.io/nunjucks/templating.html#filter)
* Lots of other bug fixes and small features, view the above issue list!


v1.3.4 (Apr 27 2015)
--------------------

This is an extremely minor release that only adds an .npmignore so that the
bench, tests, and docs folders do not get published to npm. Nunjucks should
download a lot faster now.


v1.3.3 (Apr 3 2015)
-------------------

This is exactly the same as v1.3.1, just fixing a typo in the git version tag.


v1.3.2 (Apr 3 2015)
-------------------

(no notes)


v1.3.1 (Apr 3 2015)
-------------------

We added strict mode to all the files, but that broke running nunjucks in the
browser. Should work now with this small fix.


v1.3.0 (Apr 3 2015)
-------------------

* Relative templates: you can now load a template relatively by starting the
  path with ., like ./foo.html
* FileSystemLoader now takes a noCache option, if true will disable caching
  entirely
* Additional lstripBlocks and trimBlocks available to clean output
  automatically
* New selectattr and rejectattr filters
* Small fixes to the watcher
* Several bug fixes


v1.2.0 (Feb 4 2015)
-------------------

* The special non-line-breaking space is considered whitespace now
* The in operator has a lower precedence now. This is potentially a breaking
  change, thus the minor version bump. See
  [#336](https://github.com/mozilla/nunjucks/pull/336)
* import with context now implemented:
  [#319](https://github.com/mozilla/nunjucks/pull/319)
* async rendering doesn't throw compile errors


v1.1.0 (Sep 30 2014)
--------------------

User visible changes:

* Fix a bug in urlize that would remove periods
* custom tag syntax (like {% and %}) was made Environment-specific
  internally. Previously they were global even though you set them through the
  Environment.
* Remove aggressive optimization that only emitted loop variables when uses. It
  introduced several bugs and didn't really improve perf.
* Support the regular expression syntax like /foo/g.
* The replace filter can take a regex as the first argument
* The call tag was implemented
* for tags can now take an else clause
* The cycler object now exposes the current item as the current property
* The chokidar library was updated and should fix various issues

Dev changes:

* Test coverage now available via istanbul. Will automatically display after
  running tests.


v1.0.7 (Aug 15 2014)
--------------------

Mixed up a few things in the 1.0.6 release, so another small bump. This merges
in one thing:

* The length filter will not throw an error is used on an undefined
  variable. It will return 0 if the variable is undefined.


v1.0.6 (Aug 15 2014)
--------------------

* Added the addGlobal method to the Environment object
* import/extends/include now can take an arbitrary expression
* fix bugs in set
* improve express integration (allows rendering templates without an extension)


v1.0.5 (May 1 2014)
-------------------

* Added support for browserify
* Added option to specify template output path when precompiling templates
* Keep version comment in browser minified files
* Speed up SafeString implementation
* Handle null and non-matching cases for word count filter
* Added support for node-webkit
* Other various minor bugfixes


chokidar repo fix - v1.0.4 (Apr 4 2014)
---------------------------------------

* The chokidar dependency moved repos, and though the git URL should have been
  forwarded some people were having issues. This fixed the repo and
  version.

(v1.0.3 is skipped because it was published with a bad URL, quickly fixed with
another version bump)


Bug fixes - v1.0.2 (Mar 25 2014)
--------------------------------

* Use chokidar for watching file changes. This should fix a lot of problems on
  OS X machines.
* Always use / in paths when precompiling templates
* Fix bug where async filters hang indefinitely inside if statements
* Extensions now can override autoescaping with an autoescape property
* Other various minor bugfixes


v1.0.1 (Dec 16, 2013)
---------------------

(no notes)


We've reached 1.0! Better APIs, asynchronous control, and more (Oct 24, 2013)
-----------------------------------------------------------------------------

* An asynchronous API is now available, and async filters, extensions, and
  loaders is supported. The async API is optional and if you don't do anything
  async (the default), nothing changes for you. You can read more about this
  [here](http://jlongster.github.io/nunjucks/api.html#asynchronous-support). (fixes
  [#41](https://github.com/mozilla/nunjucks/issues/41))
* Much simpler higher-level API for initiating/configuring nunjucks is
  available. Read more
  [here](http://jlongster.github.io/nunjucks/api.html#simple-api).
* An official grunt plugin is available for precompiling templates:
  [grunt-nunjucks](https://github.com/jlongster/grunt-nunjucks)
* **The browser files have been renamed.** nunjucks.js is now the full library
  with compiler, and nunjucks-slim.js is the small version that only works with
  precompiled templates
* urlencode filter has been added
* The express integration has been refactored and isn't a kludge
  anymore. Should avoid some bugs and be more future-proof;
* The order in which variables are lookup up in the context and frame lookup
  has been reversed. It will now look in the frame first, and then the
  context. This means that if a for loop introduces a new var, like {% for name
  in names %}, and if you have name in the context as well, it will properly
  reference name from the for loop inside the loop. (fixes
  [#122](https://github.com/mozilla/nunjucks/pull/122) and
  [#119](https://github.com/mozilla/nunjucks/issues/119))


v0.1.10 (Aug 9 2013)
--------------------

(no notes)


v0.1.9 (May 30 2013)
--------------------

(no notes)


v0.1.8 - whitespace controls, unpacking, better errors, and more! (Feb 6 2013)
------------------------------------------------------------------------------

There are lots of cool new features in this release, as well as many critical
bug fixes.

Full list of changes:

* Whitespace control is implemented. Use {%- and -%} to strip whitespace before/after the block.
* `for` loops implement Python-style array unpacking. This is a really nice
  feature which lets you do this:

    {% for x, y, z in [[2, 2, 2], [3, 3, 3]] %}
      --{{ x }} {{ y }} {{ z }}--
    {% endfor %}

  The above would output: --2 2 2----3 3 3--

  You can pass any number of variable names to for and it will destructure each
  array in the list to the variables.

  This makes the syntax between arrays and objects more
  consistent. Additionally, it allows us to implement the `dictsort` filter
  which sorts an object by keys or values. Technically, it returns an array of
  2-value arrays and the unpacking takes care of it. Example:

    {% for k, v in { b: 2, a: 1 } %}
      --{{ k }}: {{ v }}--
    {% endfor %}

  Output: `--b: 2----a: 1--` (note: the order could actually be anything
  because it uses javascript’s `for k in obj` syntax to iterate, and ordering
  depends on the js implementation)

    {% for k, v in { b: 2, a: 1} | dictsort %}
      --{{ k }}: {{ v }}--
    {% endfor %}

  Output: `--a: 1----b: 2--`

  The above output will always be ordered that way. See the documentation for
  more details.

  Thanks to novocaine for this!

* Much better error handling with at runtime (shows template/line/col information for attempting to call undefined values, etc)
* Fixed a regression which broke the {% raw %} block
* Fix some edge cases with variable lookups
* Fix a regression with loading precompiled templates
* Tweaks to allow usage with YUICompressor
* Use the same error handling as normal when precompiling (shows proper errors)
* Fix template loading on Windows machines
* Fix int/float filters
* Fix regression with super()


v0.1.7 - helpful errors, many bug fixes (Dec 12 2012)
-----------------------------------------------------

The biggest change in v0.1.7 comes from devoidfury (thanks!) which implements
consistent and helpful error messages. The errors are still simply raw text,
and not pretty HTML, but they at least contain all the necessary information to
track down an error, such as template names, line and column numbers, and the
inheritance stack. So if an error happens in a child template, it will print
out all the templates that it inherits. In the future, we will most likely
display the actual line causing an error.

Full list of changes:

* Consistent and helpful error messages
* Expressions are more consistent now. Previously, there were several places
  that wouldn’t accept an arbitrary expression that should. For example, you
  can now do {% include templateNames['foo'] %}, whereas previously you could
  only give it a simply variable name.
* app.locals is fixed with express 2.5
* Method calls on objects now have correct scope for this. Version 0.1.6 broke
  this and this was referencing the global scope.
* A check was added to enforce loading of templates within the correct
  path. Previously you could load a file outside of the template with something
  like ../../crazyPrivateFile.txt

You can
[view all the code changes here](https://github.com/jlongster/nunjucks/compare/v0.1.6...v0.1.7). Please
[file an issue](https://github.com/jlongster/nunjucks/issues?page=1&state=open)
if something breaks!


v0.1.6 - undefined handling, bugfixes (Nov 13, 2012)
----------------------------------------------------

This is mostly a bugfix release, but there are a few small tweaks based on
feedback:

* In some cases, backslashes in the template would not appear in the
  output. This has been fixed.
* An error is thrown if a filter is not found
* Old versions of express are now supported (2.5.11 was tested)
* References on undefined objects are now suppressed. For example, {{ foo }},
  {{ foo.bar }}, {{ foo.bar.baz }} all output nothing if foo is
  undefined. Previously only the first form would be suppressed, and a cryptic
  error thrown for the latter 2 references. Note: I believe this is a departure
  from jinja, which throws errors when referencing undefined objects. I feel
  that this is a good and non-breaking addition though. (thanks to devoidfury)
* A bug in set where you couldn’t not reference other variables is fixed
  (thanks chriso and panta)
* Other various small bugfixes

You can view
[all the code changes here](https://github.com/jlongster/nunjucks/compare/v0.1.5...v0.1.6). As
always, [file an issue](https://github.com/jlongster/nunjucks/issues) if
something breaks!



v0.1.5 - macros, keyword arguments, bugfixes (Oct 11 2012)
----------------------------------------------------------

v0.1.5 has been pushed to npm, and it’s a big one. Please file any issues you
find, and I’ll fix them as soon as possible!

* The node data structure has been completely refactored to reduce redundancy
  and make it easier to add more types in the future.
* Thanks to Brent Hagany, macros now have been implemented. They should act
  exactly the way jinja2 macros do.
* A calling convention which implements keyword arguments now exists. All
    keyword args are converted into a hash and passed as the last
    argument. Macros needed this to implement keyword/default arguments.
* Function and filter calls apply the new keyword argument calling convention
* The “set” block now appropriately only sets a variable for the current scope.
* Many other bugfixes.

I’m watching this release carefully because of the large amount of code that
has changed, so please
[file an issue](https://github.com/jlongster/nunjucks/issues) if you have a
problem with it.
