---
layout: subpage
title: FAQ
pageid: faq
---
{% raw %}

# Questions Asked Frequently Enough

## Can I use nunjucks in node and the browser/client-side?

Yes.

## Can I use the same templates between nunjucks and jinja2? What are the differences?

Kind of. There are enough differences that it might take some work.
The first problem is that nunjucks lets you access native JavaScript
constructs, while [jinja2](http://jinja.pocoo.org/) lets you access
Python. This means that there are minor gotchas like the boolean
literal being `true` in nunjucks but `True` in jinja2, and if you call
native methods on arrays the API will be different.

However, if you avoid accessing the native language features (like `{{ str.trim() }}`)
and rely solely on filters and pure templating
features, it should be easy to make templates compatible. In the
[Firefox Marketplace](https://marketplace.firefox.com/), the devs
actually created a compatibility layer that overrides some of nunjucks
internals to provide better jinja2 compatiblity (allowing the use of
`True` and more). You can [see it
here](https://github.com/mozilla/fireplace/blob/9fb5f147c136926e406fd725e4062b0866d431c4/src/media/js/lib/nunjucks.compat.js).

Additionally, there are few jinja2 features not implemented in nunjucks:

* The special `self` variable
* `for` does not support `if not` and `else`
* `with context` modifiers don't exist
* `if i is divisibleby(3)`-style conditionals
* Named block end tags: `{% endblock content %}`
* Sandboxed mode
* Line statements: `# for item in seq`

Lastly, any custom Python filters and extensions will have to be written in JavaScript.

{% endraw %}
