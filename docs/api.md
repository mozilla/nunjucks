## API Documentation

*This documentation will be improved soon using a documentation generator*

Nunjucks borrows a lot of the same concepts from [jinja2's
API](http://jinja.pocoo.org/docs/api/).

### Environment

An `Environment` is a central object which handles templates. It is
configurable, specifying how to load and render templates, and which
extensions are available. It is especially important when dealing with
template inheritance, as its used to fetch base templates. (Read more
about the `Environment` in
[jinja2](http://jinja.pocoo.org/docs/api/#basics)).

The `Environment` constructor takes an optional list of
[loaders](#loaders). You can pass a single loader or an array of
loaders. Loaders specify how to load templates, whether its from the
file system, a database, or some other source.

```js
var nunjucks = require('nunjucks');

// Without arguments, the environment defaults to a FileSystemLoader
// with the current working directory
var env = new nunjucks.Environment();

// Load templates from the 'templates' folder
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));

// The environment will look in templates first and then try loading
// from your special MyLoader class
var env = new nunjucks.Environment([new nunjucks.FileSystemLoader('templates'),
                                    new MyLoader()]);
```

#### Methods:

*init(loaders)* - Create an `Environment` object with the template
 loaders. `loaders` can be an array or a single loader. If none is
 specified, it defaults to a FileSystemLoader with the current working
 directory.

*addFilter(name, func)* - Register a custom filter

*getTemplate(name, eagerCompile)* - Get a template. `eagerCompile`
specifies if it should compile it immediately (defaults to `false`)

*express(app)* - Install nunjucks into an express app

### Template

A `Template` is an object that handles the compiling of template
strings and rendering them. The `Environment` method `getTemplate`
returns a `Template` object. You can also create one yourself.

```js
var nunjucks = require('nunjucks');
var tmpl = new nunjucks.Template('Hello {{ username }}');
```

#### Methods

*init(src, env, path, upToDate, eagerCompile)* - Create a `Template`
 object. `path` is a string, `upToDate` is a function that returns if
 the template is up to date or not. `eagerCompile` tells the template
 to compile itself immediately.

*render(ctx)* - Render a template with the context. `ctx` is a dict.

### Custom Filters

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

```
{# Show the first 5 characters #}
A message for you: {{ message|shorten }}

{# Show the first 20 characters #}
A message for you: {{ message|shorten(20) }}
```

### Custom Tags

Currently you cannot create custom tags. This will be easy to do but I
want to wait until the parser API stabilizes so that it doesn't change
after extensions are created.

