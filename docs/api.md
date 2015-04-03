---
layout: subpage
title: API
---
{% raw %}

# API

The API for nunjucks covers rendering templates, adding filters and
extensions, customizing template loading, and more.

## Simple API

If you don't need deep customization of the system, you can use this simple
higher-level API for loading and rendering templates.

**Warning**: nunjucks does not sandbox execution so it is potentially
  unsafe to run user-defined templates. On the server, you may expose
  attack vectors for accessing sensitive data. On the client, you may
  expose cross-site scripting vulnerabilities (see [this
  issue](https://github.com/mozilla/nunjucks-docs/issues/17) for more
  information).

{% endraw %}
{% api %}
render
nunjucks.render(name, [context], [callback])

Renders the template named **name** with the **context** hash. If
**callback** is provided, it will be called when done with any
possible error as the first argument and the result as the second.
Otherwise, the result is returned from `render` and errors are thrown.
See [asynchronous support](#asynchronous-support) for more info.

```js
var res = nunjucks.render('foo.html');

var res = nunjucks.render('foo.html', { username: 'James' });

nunjucks.render('async.html', function(err, res) {
});
```
{% endapi %}

{% api %}
renderString
nunjucks.renderString(str, context, [callback])

Same as [`render`](#render), but renders a raw string instead of
loading a template.

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
compile
nunjucks.compile(str, [env], [path])

Compile the given string into a reusable nunjucks Template object.

{% raw %}
```js
var template = nunjucks.compile('Hello {{ username }}');
template.render({ username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
configure
nunjucks.configure([path], [opts]);

Tell nunjucks that your templates live at **path** and flip any
feature on or off with the **opts** hash. You can provide both
arguments or either of them. **path** defaults to the current working
directory, and the following options are available in **opts**:

* **watch** *(default: true)* reload templates when they are changed
* **express** an express app that nunjucks should install to
* **autoescape** *(default: false)* controls if output with dangerous characters are
    escaped automatically. See [Autoescaping](#autoescaping)
* **tags:** *(default: see nunjucks syntax)* defines the syntax for
    nunjucks tags. See [Customizing Syntax](#customizing-syntax)

`configure` returns an `Environment` instance, which lets you add
filters and extensions while still using the simple API. See below for
more information on `Environment`.

```js
nunjucks.configure('views');

// if in the browser, you probably want to use an absolute URL
nunjucks.configure('/views');

nunjucks.configure({ autoescape: true });

nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: true
});

var env = nunjucks.configure('views');
// do stuff with env
```

{% endapi %}
{% raw %}

That's it for the simple API! If you want total control over how
templates are loaded, and more customization, you need to manually
set up the system as seen below.

## Environment

The `Environment` class is the central object which handles templates.
It knows how to load your templates, and internally templates depend
on it for inheritance and including templates. The simple API above
dispatches everything to an `Environment` instance that it keeps for
you.

You can manually handle it if you want, which allows you to specify
custom template loaders.

{% endraw %}
{% api %}
constructor
new Environment([loaders], [opts])

The constructor takes a list of **loaders** and a hash of
configuration parameters as **opts**. If **loaders** is null, it
defaults to loading from the current directory or URL. You can pass a
single loader or an array of loaders. If you pass an array of loaders,
nunjucks will walk through them in order until one of them finds a
template. See [`Loader`](#loader) for more info about loaders.

The available flags in **opts** is **autoescape** and **tags**. Read
more about those options in [`configure`](#configure) (the express and
watch options are not applicable here and configured elsewhere like [`env.express`](#express)).

In node, the [`FileSystemLoader`](#filesystemloader) is available to
load templates off the filesystem, and in the browser the [`WebLoader`](#webloader)
is available to load over HTTP (or use precompiled templates). If you
use the simple [`configure`](#configure) API, nunjucks automatically
creates the appropriate loader for you, depending if your in node or
the browser. See [`Loader`](#loader) for more information.

```js
// the FileSystemLoader is available if in node
var env = new Environment(new nunjucks.FileSystemLoader('views'));

var env = new Environment(new nunjucks.FileSystemLoader('views'),
                          { autoescape: false });

var env = new Environment([new nunjucks.FileSystemLoader('views'),
                           new MyCustomLoader()]);

// the WebLoader is available if in the browser
var env = new Environment(new nunjucks.WebLoader('/views'));
```
{% endapi %}

{% api %}
render
env.render(name, [context], [callback])

Render the template named **name** with the optional **context** hash.
If **callback** is supplied, call it when done with any errors and the
result (see [asynchronous support](#asynchronous-support)), otherwise
return the rendered string.

```js
var res = nunjucks.render('foo.html');

var res = nunjucks.render('foo.html', { username: 'James' });

nunjucks.render('async.html', function(err, res) {
});
```

{% endapi %}

{% api %}
renderString
env.renderString(src, [context], [callback])

Same as [`render`](#render1), but renders a raw string instead of
loading a template.

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
addFilter
env.addFilter(name, func, [async])

Add a custom filter named **name** which calls **func** whenever
invoked. If the filter needs to be async, **async** must be `true`
(see [asynchronous support](#asynchronous-support)). See 
[Custom Filters](#custom-filters).

{% endapi %}

{% api %}
getFilter
env.getFilter(name)
Get the filter, which is just a function, named **name**.
{% endapi %}

{% api %}
addExtension
env.addExtension(name, ext)

Add the custom extension **ext** named **name**. **ext** is an object
with a few specific methods that are called by the extension system.
See [Custom Tags](#custom-tags).

{% endapi %}

{% api %}
getExtension
env.getExtension(name)
Get an extension named **name**.
{% endapi %}

{% api %}
addGlobal
env.addGlobal(name, value)
Add a global value that will be available to all templates. Note: this will overwrite any existing global called `name`.
{% endapi %}

{% api %}
getTemplate
env.getTemplate(name, [eagerCompile], [callback])

Retrieve the template named **name**. If **eagerCompile** is `true`,
compile it now instead of on render. If **callback** is supplied, call
it with any errors and a template (if found), otherwise return
synchronously. If using any async loaders, you must use the async API.
The builtin loaders do not require this. See
[asynchronous support](#asynchronous-support) and [loaders](#loader).

```js
var tmpl = env.getTemplate('page.html');

var tmpl = env.getTemplate('page.html', true);

env.getTemplate('from-async-loader.html', function(err, tmpl) {
});
```
{% endapi %}

{% api %}
express
env.express(app)

Install nunjucks as the rendering engine for the express **app**.
After doing this, you can use express normally. Note that you can do
this automatically with the simple API call [`configure`](#configure)
by passing in the app as the **express** option.

```js
var app = express();
env.express(app);

app.get('/', function(req, res) {
    res.render('index.html');
});
```
{% endapi %}
{% raw %}

## Template

A `Template` is an object that handles the compiling of template
strings and rendering them. Usually the `Environment` handles them for
you, but you can easily use it yourself. If you don't connect a
template with an environment, you can't include or inherit any other
templates.

{% endraw %}
{% api %}
constructor
new Template(src, [env], [path], [eagerCompile])

The constructor takes a template string **src**, an optional
`Environment` instance **env** to use for loading other templates, a
string **path** describing the location/path for debugging purposes,
and a boolean **eagerCompile** which, if `true`, kicks off compilation
immediately instead of waiting until the template is rendered.

{% raw %}
```js
var tmpl = new nunjucks.Template('Hello {{ username }}');

tmpl.render({ username: "James" }); // -> "Hello James"
```
{% endraw %}

{% endapi %}

{% api %}
render
tmpl.render(context, [callback])

Renders the template with the optional **context** hash. If
**callback** is supplied, call it when done with any errors and the
result (see [asynchronous support](#asynchronous-support)), otherwise
return the rendered string.

{% endapi %}
{% raw %}

## Loader

A loader is an object that takes a template name and loads it from a
source, such as the filesystem or network. The following two builtin
loaders exist, each for different contexts.

{% endraw %}
{% api %}
FileSystemLoader
new FileSystemLoader([searchPaths], [noWatch])

This is only available to node. It will load templates from the
filesystem, using the **searchPaths** array as paths to look for
templates. **searchPaths** can also be a single path for where
templates live, and it defaults to the current working directory. If
**noWatch** is `true`, templates are permanently cached and you won't
see any changes; otherwise it uses `fs.watch` to watch for changes.

```js
// Loads templates from the "views" folder
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
```

{% endapi %}

{% api %}
WebLoader
new WebLoader([baseURL], [neverUpdate])

This is only available in the browser. **baseURL** is the URL to load
templates from (must be the same domain), and it defaults to the
current relative directory. If **neverUpdate** is `true` templates
will only ever be fetched once, so you won't see any updates to
templates; the default is to load the template every time it is
rendered.

This loader also recognizes when precompiled templates are available
and automatically uses them instead of fetching over HTTP. In
production, this should always be the case. See
[Precompiling](#precompiling).

```js
// Load templates from /views
var env = new nunjucks.Environment(new nunjucks.WebLoader('/views'))
```
{% endapi %}
{% raw %}

### Writing a Loader

You can write loaders for more complex loading, like from a database.
If you want to do this, just create an object that has a method
`getSource(name)`, where **name** is the name of the template. That's it.

```js
function MyLoader(opts) {
    // configuration
}

MyLoader.prototype.getSource = function(name) {
    // load the template
    // return an object with:
    //   - src:     String. The template source.
    //   - path:    String. Path to template.
    //   - noCache: Bool. Don't cache the template (optional).
}
```

It can get a little more complex. If you want to track updates to
templates and bust the internal cache so that you can see updates, you
need to extend the `Loader` class. This gives you `emit` method that
can fire events. You need to call it 

```js
var MyLoader = nunjucks.Loader.extend({
    init: function() {
        // setup a process which watches templates here
        // and call `this.emit('update', name)` when a template
        // is changed
    }
    
    getSource: function(name) {
        // load the template
    }
});
```

#### Asynchronous

There's one last piece: asynchronous loaders. So far, all of the
loaders have been synchronous; `getSource` returns the source
immediately. The benefit of this is that the user isn't forced to use
the asynchronous API and be aware of edge cases about async templates.
You might want to load from a database, however.

Just add an `async: true` property to your loader and it will be used
asynchronously.

```js
var MyLoader = nunjucks.Loader.extend({
    async: true,
    
    getSource: function(name, callback) {
        // load the template
        // ...
        callback(err, res);
    }
});
```

Remember that you now have to use the asynchronous API. See
[asynchronous support](#asynchronous-support).

**Warning**: if you are using an asynchronous loader, you can't load
  templates inside `for` loops. You need to explicitly use the
  `asyncEach` tag if you need to load templates, which is exactly the
  same as `for` but asynchronous. More info can be found at
  [Be Careful!](#be-careful).


## Browser Usage

Using nunjucks in the browser takes a little more thought because you
care about load and compile time. On the server-side, templates are
compiled once and cached in memory and you never have to worry about
it. On the client-side however, you don't want to compile templates
even once, as it would result in slow page render time.

The solution is to precompile your templates into JavaScript, and load
them as a simple `.js` file on page load.

Maybe you do want to dynamically load templates while developing,
however, so that you can see changes immediately without recompiling.
Nunjucks tries to adapt to whatever workflow you want.

The only rule you must follow: **always precompile your templates in
production**. Why? Not only is it slow to compile all your templates
on page load, they are loaded *synchronously* over HTTP, blocking the
whole page. It is slow. It does this because nunjucks isn't async by
default.

### Recommended Setups

These are two of the most popular ways to set up nunjucks on the
client-side. Note that there are two different js files: one with the
compiler, nunjucks.js, and one without the compiler, nunjucks-slim.js.
Read [Getting Started](getting-started.html) for a brief overview of
the differences.

See [Precompiling](#precompiling) for information on precompiling
templates.

#### Setup #1: only precompile in production

This method will give you a setup that dynamically loads templates
while developing (you can see changes immediately), but uses
precompiled templates in production.

1. Load [nunjucks.js](files/nunjucks.js) with either a script tag or a module loader.
2. Render templates ([example](#simple-api))!
3. When pushing to production, [precompile](#precompiling) the templates into a js file
   and load it on the page

> An optimization is to use `nunjucks-slim.js` instead of
> `nunjucks.js` in production since you are using precompiled
> templates there. It's 8K instead of 20K because it doesn't contain
> the compiler. This complicates the setup though because you are
> using different js files between dev and prod, so it may or may not
> be worth it.

#### Setup #2: always precompile

This method always uses precompiled templates while developing and in
production, which simplifies the setup. However, you're going to want
something that automatically recompiles templates while developing
unless you want to manually recompile them after every change.

1. For development, use the [grunt task](https://github.com/jlongster/grunt-nunjucks) to watch
your template directory for changes and automatically [precompile](#precompiling) them
into a js file
2. Load [nunjucks-slim.js](files/nunjucks-slim.js) and `templates.js`, or whatever you named
the precompiled js file, with either a script tag or a module loader.
3. Render templates ([example](#simple-api))!

With this method, there are no differences between development and
production code. Simply commit the templates.js file and deploy the
same code to production.

## Precompiling

To precompile your templates, use the `nunjucks-precompile` script
that comes with nunjucks. You can pass it a directory or a file and it
will generate all the JavaScript for your templates.

```
// Precompiling a whole directory
$ nunjucks-precompile views > templates.js

// Precompiling individual templates
$ nunjucks-precompile views/base.html >> templates.js
$ nunjucks-precompile views/index.html >> templates.js
$ nunjucks-precompile views/about.html >> templates.js
```

All you have to do is simply load `templates.js` on the page, and the
system will automatically use the precompiled templates. There are
zero changes necessary.

There are various options available to the script. Simply invoke
`nunjucks-precompile` to see more info about them. Note that **names
of all asynchronous filters need to passed to the script** since they
need to be known at compile-time. You can pass a comma-delimited list
of async filters with `-a`, like `-a foo,bar,baz`. If you only use
normal synchronous filters, you don't need to do anything.

Extensions cannot be specified with this script. You must use the
precompile API below if you use them.

### API

There is also an API if you want to programmatically precompile
templates. You'll want to do this if you use extensions or you use
asynchronous filters, both of which need to be known at compile-time.
You can pass an `Environment` object straight into the precompiler and
it will get the extensions and filters from it. You should share the
same `Environment` object between the client and server to keep
everything in sync.

{% endraw %}
{% api %}
precompile
nunjucks.precompile(path, [opts])

Precompile a file or directory at **path**. **opts** is a hash with any of the following options:

* **name**: name of the template, when compiling a string (required)
    or a file (optional, defaults to **path**). names are
    auto-generated when compiling a directory.
* **asFunction**: generate a callable function
* **force**: keep compiling on error
* **env**: the Environment to use (gets extensions and async filters from it)
* **include**: array of file/folders to include (folders are auto-included, files are auto-excluded)
* **exclude**: array of file/folders to exclude (folders are auto-included, files are auto-excluded)

```js
var env = new nunjucks.Environment();

// extensions must be known at compile-time
env.addExtension('MyExtension', new MyExtension());

// async filters must be known at compile-time
env.addFilter('asyncFilter', function(val, cb) {
  // do something
}, true);

nunjucks.precompile('/dir/to/views', { env: env });
```
{% endapi %}

{% api %}
precompileString
nunjucks.precompileString(str, [opts])

Exactly the same as [`precompile`](#precompile), but compiles a raw string.

{% endapi %}
{% raw %}

## Asynchronous Support

You only need to read this section if you are interested in
asynchronous rendering. There is no performance benefit to this, it is
soley to allow custom filters and extensions to make async calls. If
you don't care about this, you should simply use the normal API like
`var res = env.render('foo.html');`. There's no need to force the
`callback` on you, and it's why it's optional in all the rendering
functions.

As of version 1.0, nunjucks provides a way to render templates
asynchronously. This means that custom filters and extensions can do
stuff like fetch things from the database, and template rendering is
"paused" until the callback is called.

Template loaders can be async as well, allowing you to load templates
from a database or somewhere else. See
[Writing a Loader](#writing-a-loader). If you are using an async
template loader, you must use the async API. The builtin loaders that
load from the filesystem and over HTTP are synchronous, which is not a
performance problem because they are cached from the filesystem and
you should precompile your templates and never use HTTP in production.

If you are using anything async, you need to use the async API like this:

```js
nunjucks.render('foo.html', function(err, res) {
   // check err and handle result
});
```

Read more about async [`filters`](#asynchronous1), [`extensions`](#asynchronous2), and
[`loaders`](#asynchronous).

### Be Careful!

Nunjucks is synchronous by default. Because of this, you need to
follow a few rules when writing asynchronous templates:

* Always use the async API. `render` should take a function that takes
  a callback.
* Async filters and extensions need to be known at compile-time, so
  you need to specify them explicitly when precompiling (see
  [Precompiling](#precompiling)).
* If you are using a custom template loader that is asynchronous, you
  can't include templates inside a `for` loop. This is because `for`
  will compile to an imperative JavaScript `for` loop. You need to
  explicitly use the async `asyncEach` tag to iterate, which is
  exactly the same as `for` except asynchronous.

## Autoescaping

By default, nunjucks will render all output as it is. If turn on
autoescaping, nunjucks will escape all output by default. It's
recommended that you do this for security reasons.

Autoescaping is rather simplistic in nunjucks right now. All you have
to do is pass the `autoescape` option as `true` to the `Environment`
object. In the future, you will have more control over which files
this kicks in.

```js
var env = nunjucks.configure('/path/to/templates', { autoescape: true });
```

## Customizing Syntax

If you want different tokens than `{{` and the rest for variables,
blocks, and comments, you can specify different tokens as the `tags`
option:

```js
var env = nunjucks.configure('/path/to/templates', {
  tags: {
    blockStart: '<%',
    blockEnd: '%>',
    variableStart: '<$',
    variableEnd: '$>',
    commentStart: '<#',
    commentEnd: '#>'
  }
});
```

Using this environment, templates will look like this:

```
<ul>
<% for item in items %>
  <li><$ item $></li>
<% endfor %>
</ul>
```

## Custom Filters

To install a custom filter, use the `Environment` method `addFilter`.
A filter is simply a function that takes the target object as the
first argument and any arguments passed to the filter as the other
arguments, in order.

```js
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
});
```

This adds a filter `shorten` which returns the first `count`
characters in a string, with `count` defaulting to 5. Here is how it
is used:

```jinja
{# Show the first 5 characters #}
A message for you: {{ message|shorten }}

{# Show the first 20 characters #}
A message for you: {{ message|shorten(20) }}
```

### Keyword/Default Arguments

As described in the
[templating section](templating#Keyword-Arguments), nunjucks supports
keyword/default arguments. You can write a normal javascript filter
that leverages them.

All keyword arguments are passed in as a hash as the last argument.
This is a filter `foo` that uses keyword arguments:

```js
env.addFilter('foo', function(num, x, y, kwargs) {
   return num + (kwargs.bar || 10);
})
```

The template can use it like this:

```jinja
{{ 5 | foo(1, 2) }}          -> 15
{{ 5 | foo(1, 2, bar=3) }}   -> 8
```

You *must* pass all of the positional arguments before keyword
arguments (`foo(1)` is valid but `foo(1, bar=10)` is not). Also, you
cannot set a positional argument with a keyword argument like you can
in Python (such as `foo(1, y=1)`)

### Asynchronous

Asynchronous filters receive a callback to resume rendering, and are
created by passing `true` as the third argument to `addFilter`.

```js
var env = nunjucks.configure('views');

env.addFilter('lookup', function(name, callback) {
    db.getItem(name, callback);
}, true);

env.renderString('{{ item|lookup }}', function(err, res) {
    // do something with res
});
```

Make sure to call the callback with two arguments: `callback(err, res)`. `err` can be null, of course.

Note: When precompiling, **you must tell the precompiler the names of
all asynchronous filters**. See
[Precompiling](#precompiling).

## Custom Tags

You can create more complicated extensions by creating custom tags.
This exposes the parser API and allows you to do anything you want
with the template.

Note: When precompiling, **you must install the extensions at
compile-time**. You have to use the [precompiling API](#api1) (or the
[grunt task](https://github.com/jlongster/grunt-nunjucks)) instead of
the script. You'll want to create a [`Environment`](#environment)
object, install your extensions, and pass it to the precompiler.

An extension is a javascript object with at least two fields: `tags`
and `parse`. Extensions basically register new tag names and take
control of the parser when they are hit.

`tags` is an array of tag names that the extension should handle.
`parse` is the method that actually parses them when the template is
compiled. Additionally, there is a special node type `CallExtension`
that you can use to call any method on your extension at runtime. This
is explained more below.

Because you have to interact directly with the parse API and construct
ASTs manually, this is a bit cumbersome. It's necessary if you want to
do really complex stuff, however. Here are a few key parser methods
you'll want to use:

* `parseSignature([throwErrors], [noParens])` - Parse a list of
  arguments. By default it requires the parser to be pointing at the
  left opening paranthesis, and parses up the right one. However, for
  custom tags you shouldn't use parantheses, so passing `true` to the
  second argument tells it to parse a list of arguments up until the
  block end tag. A comma is required between arguments. Example: `{%
  mytag foo, bar, baz=10 %}`

* `parseUntilBlocks(names)` - Parse content up until it hits a block
  with a name in the `names` array. This is useful for parsing content
  between tags.

The parser API needs to be more documented, but for now read the above
and check out the example below. You can also look at the
[source](https://github.com/mozilla/nunjucks/blob/master/src/parser.js).

The most common usage is to process the content within some tags at
runtime. It's like filters, but on steroids because you aren't
confined to a single expression. You basically want to lightly parse
the template and then get a callback into your extension with the
content. This is done with the `CallExtension` node, which takes an
extension instance, the method to call, list of arguments parsed from
the tag, and a list of content blocks (parsed with
`parseUntilBlocks`).

For example, here's how you would implement an extension that fetches
content from a URL and injects it into the page:

```js
function RemoteExtension() {
    this.tags = ['remote'];

    this.parse = function(parser, nodes, lexer) {
        // get the tag token
        var tok = parser.nextToken();

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        // parse the body and possibly the error block, which is optional
        var body = parser.parseUntilBlocks('error', 'endremote');
        var errorBody = null;

        if(parser.skipSymbol('error')) {
            parser.skip(lexer.TOKEN_BLOCK_END);
            errorBody = parser.parseUntilBlocks('endremote');
        }

        parser.advanceAfterBlockEnd();

        // See above for notes about CallExtension
        return new nodes.CallExtension(this, 'run', args, [body, errorBody]);
    };

    this.run = function(context, url, body, errorBody) {
        var id = 'el' + Math.floor(Math.random() * 10000);
        var ret = new nunjucks.runtime.SafeString('<div id="' + id + '">' + body() + '</div>');
        var ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function() {
            if(ajax.readyState == 4) {
                if(ajax.status == 200) {
                    document.getElementById(id).innerHTML = ajax.responseText;
                }
                else {
                    document.getElementById(id).innerHTML = errorBody();
                }
            }
        };

        ajax.open('GET', url, true);
        ajax.send();

        return ret;
    };
}

env.addExtension('RemoteExtension', new RemoteExtension());
```

Use it like this:

```jinja
{% remote "/stuff" %}
  This content will be replaced with the content from /stuff
{% error %}
  There was an error fetching /stuff
{% endremote %}
```

### Asynchronous

Another available node is `CallExtensionAsync` which is an
asynchronous version of `CallExtension`. It calls back into your
extension at runtime, with an additional parameter: a callback.
Template rendering is paused until you call the callback to resume.

The `run` function from the above example would now look like:

```js
this.run = function(context, url, body, errorBody, callback) {
   // do async stuff and then call callback(err, res)
};
```

If you create anything interesting, make sure to
[add it to the wiki!](https://github.com/mozilla/nunjucks/wiki/Custom-Tags)

{% endraw %}
