---
layout: subpage
pageid: getting-started
---

# Getting Started

## User-Defined Templates Warning

  nunjucks does not sandbox execution so **it is not safe to run
  user-defined templates or inject user-defined content into template
  definitions**. On the server, you can expose attack vectors for
  accessing sensitive data and remote code execution. On the client,
  you can expose cross-site scripting vulnerabilities even for
  precompiled templates (which can be mitigated with a strong
  [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)). See
  [this issue](https://github.com/mozilla/nunjucks-docs/issues/17) for
  more information.

## When Using Node...

```
$ npm install nunjucks
```

Once installed, simply use `require('nunjucks')` to load it.

To use Nunjuck's built-in watch mode, Chokidar must be installed separately:

```
$ npm install nunjucks chokidar
```

Nunjucks supports all modern browsers and any version of Node.js
[currently supported by the Node.js Foundation](https://github.com/nodejs/Release#release-schedule1).
This includes the most recent version and all versions still in maintenance.

## When in the Browser...

Grab [nunjucks.js](files/nunjucks.js) ([min](files/nunjucks.min.js)) for the full library, or
[nunjucks-slim.js](files/nunjucks-slim.js) ([min](files/nunjucks-slim.min.js)) for the slim version
which only works with precompiled templates.

### Which file should you use?

* Use **nunjucks.js** to dynamically load templates, auto-reload
  templates when they are changed, and use precompiled templates.
  Comes with the full compiler so is larger (20K min/gzipped). Use
  this to get started, and use in production if you don't mind a
  larger file size.

* Use **nunjucks-slim.js** to load precompiled templates and use them. Doesn't
  come with the full compiler so it's smaller (8K min/gzipped), but *only* works with
  precompiled templates. Typically used for production, and possibly
  development if you use the [grunt](https://github.com/jlongster/grunt-nunjucks) or [gulp](https://github.com/sindresorhus/gulp-nunjucks) tasks to automatically recompile templates.

Simply include nunjucks with a `script` tag on the page:

```html
<script src="nunjucks.js"></script>
```

or load it as an AMD module:

```js
define(['nunjucks'], function(nunjucks) {
});
```

> Whatever you do, make sure to precompile your templates in
> production! There are [grunt](https://github.com/jlongster/grunt-nunjucks)
> and [gulp](https://github.com/sindresorhus/gulp-nunjucks) tasks to help with
> that. Read more about optimal client-side configurations in [Browser
> Usage](api.html#browser-usage).

## Usage

This is the simplest way to use nunjucks. First, set any configuration
flags (i.e. autoescaping) and then render a string:

```js
nunjucks.configure({ autoescape: true });
nunjucks.renderString('Hello {% raw %}{{ username }}{% endraw %}', { username: 'James' });
```

You usually won't use `renderString`, instead you should write
templates in individual files and use `render`. That way you can
inherit and include templates. In this case, you need to tell nunjucks
where these files live with the first argument of `configure`:

```js
nunjucks.configure('views', { autoescape: true });
nunjucks.render('index.html', { foo: 'bar' });
```

See the [hello world example on github](https://github.com/mozilla/nunjucks/tree/master/samples/hello-world).

In node, `'views'` would be a path relative to the current working
directory. In the browser, it would be a relative URL, and you
probably want it to be absolute, like `'/views'`.

Using express? Simply pass your express app into `configure`:

```js
var app = express();

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function(req, res) {
    res.render('index.html');
});
```

The above API works in node and in the browser (express is only in
node, obviously). In node, nunjucks loads templates from the
filesystem by default, and in the browser loads them over HTTP.

If you [precompiled](api.html#precompiling) your templates in the browser, they will
automatically be picked up by the system and nothing more has
to be changed. This makes it easy to use the same code in
development and production, while using precompiled templates in
production.

## More Information

That's only the tip of the iceberg. See [API](api.html) for API docs
and [Templating](templating.html) about the templating language.
