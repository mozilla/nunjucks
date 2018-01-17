---
layout: subpage
title: FAQ
pageid: faq
---
{% raw %}

# Questions Asked Frequently Enough

## Can I use nunjucks in node and the browser/client-side?

Yes. Nunjucks supports all modern browsers and any version of Node.js
[currently supported by the Node.js Foundation](https://github.com/nodejs/Release#release-schedule1).

## Can I precompile templates for server-side use (Node/Express)?

No, precompiled templates are a browser/client-side optimization only. 
It is not necessary to precompile on the server because templates are
compiled then cached the first time they are individually loaded for rendering. 
The compiled template will then remained cached in memory until the server restarts.

You can choose never to cache by setting [configure](api.html#configure)'s `noCache` option to `true`.

## Can I use the same templates between nunjucks and jinja2? What are the differences?

Kind of. There are enough differences that it might take some work.
The first problem is that nunjucks lets you access native JavaScript
constructs, while [jinja2](http://jinja.pocoo.org/) lets you access
Python. This means that there are minor gotchas like the boolean
literal being `true` in nunjucks but `True` in jinja2, and if you call
native methods on arrays the API will be different.

However, if you avoid accessing the native language features (like `{{ str.trim() }}`)
and rely solely on filters and pure templating
features, it should be easy to make templates compatible.

Nunjucks has experimental support for installing APIs into the
templating environment to help with Jinja compatibility. See
[installJinjaCompat](api.html#installjinjacompat).

Additionally, there are few jinja2 features not implemented in nunjucks:

* The special `self` variable
* `for` does not support `if not` and `else`
* `if i is divisibleby(3)`-style conditionals
* Named block end tags: `{% endblock content %}`
* Sandboxed mode
  * Note: this makes it **unsuitable for applications requiring [user-defined templates](api.html#user-defined-templates-warning)**
* Line statements: `# for item in seq`

Lastly, any custom Python filters and extensions will have to be written in JavaScript.

{% endraw %}
