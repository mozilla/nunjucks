
# Nunjucks

Nunjucks is a full featured templating engine for javascript. It is a
direct port of the Python-powered [jinja2](http://jinja.pocoo.org/)
templating engine and aims to be feature-complete with jinja2.

It was born out of frustration with other javascript templating
engines. The most popular ones either are ugly and don't abstract
enough (EJS) or have too different of a syntax (Jade).

The only other project like this is
[jinjs](https://github.com/ravelsoft/node-jinjs), which seems to have
been abandoned. The code is also not Javascript, but Coco, is
difficult to work on, has bugs, and is missing features.. Nunjucks
hopes to be a robust, pure javascript, and easily extended port of
jinja2.

## Installation

`npm install nunjucks`

## Features

* variables, iteration, array/dict lookups
* it's very fast, as fast or faster than jinja2
* template inheritance allows you to easily share templates across
  your site, without having to touch code
* jinja2-style parsing of code `{{ foo('bar', 1) }}`
* operators: `+ - * / < > ==` and more
* include other templates with `include`
* ignore template parsing with `raw` tag
* and more

View [jinja2's homepage](http://jinja.pocoo.org/) for a full list of
features. Like that page says, "Jinja is beautiful":

```
{% extends "layout.html" %}
{% block body %}
  <ul>
  {% for user in users %}
    <li><a href="{{ user.url }}">{{ user.username }}</a></li>
  {% endfor %}
  </ul>
{% endblock %}
```

## Usage

First, require nunjucks:

```js
var nunjucks = require('nunjucks');
```

You can create a template from a string and render it:

```js
var tmpl = new nunjucks.Template('Hello {{ username }}');
console.log(tmpl.render({ username: "james" }));
```

You can use an environment which allows you to fetch files from the
file system. See the [`Environment`](#environment) class for more details.

```js
var env = new nunjucks.Environment();
var tmpl = env.getTemplate('test.html');
console.log(tmpl.render({ username: "james" }));
```

## Express

You can also tell nunjucks to install itself in your express app.
Assuming your templates are in the `templates` folder:

```js
var nunjucks = require('nunjucks');
var loaders = nunjucks.loaders;
var express = require('express');

var env = new nunjucks.Environment(new loaders.FileSystemLoader('templates'));
env.express(app);
```

The `FileSystemLoader` takes a path, so change it to wherever your
templates live.

## How Nunjucks is Different from Jinja2

There are a few differences due to different semantics between
javascript and Python or missing features. Items marked "todo" are
ones I intend to implement soon. Other ones may be implemented at some
point but are more obscure and not as important.

Missing features and differences:

* Object iteration: `{% for k, v in obj %}`. Only array
  iteration is supported right now. (todo)
* Macros (todo)
* Whitespace control: `{%-` and `-%}` (todo)
* The special `self` variable (todo)
* Autoescaping (todo)
* inline conditionals: `for if bar else baz` (todo)
* `for` loop needs special variables like `loop.first` (todo)
* `set` tag (todo)
* Installing custom tags (todo)
* Scoping is not as fine-grained, special modifiers like `with
  context` does not exist
* Tests: `if i is divisibleby(3)`
* Named block end-tags: `{% endblock content %}`
* Sandboxed mode
* Line statements: `# for item in seq`
* Using `block` inside of `for` loops does not work
* The API is different, especially for writing custom tags. See `API`.

## FAQ

* Why another templating system?

I've been unhappy with any of the existing ones for javascript.
Mustache is great, but it's not really built to be the main templating
system of a large app. It lacks sophisticated features such as
template inheritance, and the need is obviously there as seen in this
[github issue](https://github.com/mustache/spec/issues/38).

EJS is really ugly and forces you to put too much logic in templates.
Jade is cool but forces a completely difference whitespace-based
syntax on you, which isn't my style. jinjs is a jinja2 port, but is
buggy and abandoned. Most other systems that are similar to jinja2
either lack the specific jinja2 features I want or are hacky and buggy.

jinja2 is a proven, successful templating system. I think javascript
needs a robust, feature-complete port of it.

* Can I use Nunjucks in client-side javascript?

Not yet, but that is coming in the next version.

* When Nunjucks is available client-side, can I share templates
  between Python/jinja2 and javascript/nunjucks?

No, that is not the purpose of this project. There will be subtle
differences as documented in the "How is nunjucks different than
jinja2" section, and some very obscure features may never be
implemented. Additionally, custom filters and tags are not easily
available to multiple languages, as they are written specifically in
Python or javascript.

* How hard is it to convert jinja2 templates to nunjucks?

It should be very easy. The differences are very small, but they are
there. Depending on what features you use, you may need to make small
tweaks. The biggest hurdle will be porting any custom filters or tags
to javascript.

Read the ["How is nunjucks different from
jinja2"](how-nunjucks-is-different-from-jinja2) section for more
information on how nunjucks differs from jinja2.

## Status

All of the features that will be in v0.1 have been ported over. I am
currently testing the codebase and letting it solidify before I make
the first release. The focus is now documentation, benchmarks, and
tests.

Features needed for v0.1:

* Thorough-ish documentation, especially what features are missing
* Builtin filters
* Display pretty errors
* Better express integration
* Benchmarks (it's fast, how to prove it?)

Features needed for v0.2:

* Client-side js support (load precompiled templates, convert modules, etc)
* Macros, a few other missing jinja2 constructs
* Even more thorough documentation
* Autoescaping

## Templating System Documentation

For now, head over to [jinja's
documentation](http://jinja.pocoo.org/docs/templates/) for templates.
Nunjucks supports most of jinja's features, and those docs are
very good. Nunjucks will get better docs over time.

Please read ["How Nunjucks is Different from
Jinja2"](#how-nunjucks-is-different-from-jinja2) to see what features
are missing. Nunjucks is being quickly developed and will implement
missing features over time.

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
[loaders](#loaders). You can pass a single loader or a an array of
loaders. Loaders specify how to load templates, whether its from the
file system, a database, or a different source.

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

*init(loaders)* - Create a `Template` object with the template
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
