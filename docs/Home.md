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
difficult to work on, has bugs, and is missing features. Nunjucks
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

You can use filters to add a little bit of logic to your templates:

```
{% for category, members in items | groupby('category') %}
  <h1>{{ name }}</h1>
  <ul>
  {% for item in members %}
    <li>{{ item.description }}</li>
  {% endfor %}
  </ul>
{% endfor %}
```

This groups a list of objects by the "category" attribute so that you
can list them by category. Nunjucks comes with several builtin
filters (needs documentation) and the ability to add your own.

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

<a name="jinja2-differences"></a>
## How Nunjucks is Different from Jinja2

There are a few differences due to different semantics between
javascript and Python or missing features. Items marked "todo" are
ones I intend to implement soon. Other ones may be implemented at some
point but are more obscure and not as important.

Missing features and differences:

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

### Why another templating system?

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

### Can I use Nunjucks in client-side javascript?

Not yet, but that is coming in the next version.

### When Nunjucks is available client-side, can I share templates between Python/jinja2 and javascript/nunjucks?

No, that is not the purpose of this project. There will be subtle
differences as documented in the "How is nunjucks different than
jinja2" section, and some very obscure features may never be
implemented. Additionally, custom filters and tags are not easily
available to multiple languages, as they are written specifically in
Python or javascript.

### How hard is it to convert jinja2 templates to nunjucks?

It should be very easy. The differences are very small, but they are
there. Depending on what features you use, you may need to make small
tweaks. The biggest hurdle will be porting any custom filters or tags
to javascript.

Read the [How Nunjucks is Different from Jinja2](#wiki-jinja2-differences)
section for more information on how nunjucks differs from jinja2.

## Status

All of the features that will be in v0.1 have been ported over. I am
currently testing the codebase and letting it solidify before I make
the first release. The focus is now documentation, benchmarks, and
tests.

Features needed for v0.1:

* Thorough-ish documentation, especially the API and client-side stuff
* Builtin filters
* Display pretty errors
** Add a global error handler and attempt to inject nice errors
* Better express integration
* Benchmarks (it's fast, how to prove it?)

Features needed for v0.2:

* Macros, a few other missing jinja2 constructs
* Even more thorough documentation
* Autoescaping
