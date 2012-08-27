
Nunjucks
========

Nunjucks is the Python-powered [jinja2](http://jinja.pocoo.org/)
templating engine ported to javascript.

It was born out of frustration with other javascript templating
engines. The most popular ones either are ugly and don't abstract
enough (EJS) or have too different of a syntax (Jade).

This is for people who are used to Jinja and similar systems, and for
anyone else who thinks this is a better way to do it.

Templating System Documentation
-------------------------------

For now, head over to [jinja's
documentation](http://jinja.pocoo.org/docs/templates/) for templates.
Nunjucks supports almost all of jinja's features, and those docs are
very good. Nunjucks will get better docs over time.

jinja2 features that nunjucks does not support:

* Autoescaping
* inline conditionals: `foo if bar else baz`
* Macros
* l10n
* `set` statement
* `with` extension
* Tests (`if i is divisibleby(3)`)
* Whitespace control (`{%-` and `-%}`)
* Line statements (`# for item in seq`)

nunjucks is being quickly developed however and will adopt these
features over time.

API Documentation
-----------------

nunjucks borrows a lot of the same concepts from [jinja2's
API](http://jinja.pocoo.org/docs/api/).

An `Environment` is a central object which handles templates. It is
configurable, specifying how to load and render templates, and which
extensions are available. It is especially important when dealing with
template inheritance, as its used to fetch base templates. (Read more
about the `Environment` in
[jinja2](http://jinja.pocoo.org/docs/api/#basics)).

