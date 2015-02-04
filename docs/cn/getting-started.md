---
layout: subpage
pageid: getting-started
---

# 快速上手

## Node 端使用

```
$ npm install nunjucks
```

下载后可直接 `require('nunjucks')` 使用

## 浏览器端使用

可直接使用 [nunjucks.js](files/nunjucks.js) ([min](files/nunjucks.min.js))，如果针对编译后的模板可使用 [nunjucks-slim.js](files/nunjucks-slim.js) ([min](files/nunjucks-slim.min.js))。

### 你应该使用哪个文件

* **nunjucks.js** 可用于动态加载模板，当模板变化时重新加载，也可以用于预编译后的模板。包含编译器，所以会比较大 (20K min/gzipped)。如果你刚接触 nunjucks 可使用这个文件，如果你不在意大小也可以在生产环境使用。
 
* **nunjucks-slim.js** 只能用于预编译后的模板，只包含运行时的代码，所以比较小 (8K min/gzipped)。一般用于生产环境，如果你使用 [grunt task](https://github.com/jlongster/grunt-nunjucks) 自动预编译，也可以在开发环境使用。

直接用 `script` 引入文件：

```html
<script src="nunjucks.js"></script>
```

或者可以作为一个 AMD 模块加载：

```js
define(['nunjucks'], function(nunjucks) {
});
```

> 确保在生产环境使用预编译版本，可使用 [grunt
> task](https://github.com/jlongster/grunt-nunjucks)，可在 [浏览器使用](api.html#browser-usage) 查看客户端优化的配置。

## 使用说明

这是最简单使用 nunjucks 的方式，首先设置配置项(如 autoescaping)，然后渲染一个字符串：

```js
nunjucks.configure({ autoescape: true });
nunjucks.renderString('Hello {% raw %}{{ username }}{% endraw %}', { username: 'James' });
```

`renderString` 并不常用，而是使用 `render` 来直接渲染文件，这种方式支持继承(extends)和包含(include)模板。使用之前需要配置文件的路径：

```js
nunjucks.configure('views', { autoescape: true });
nunjucks.render('index.html', { foo: 'bar' });
```

在 node 端，`'views'` 为相对于当前工作目录 (working
directory) 的路径。在浏览器端则为一个相对的 url，最好指定为绝对路径 (如 `'/views'`)。

如果使用 express 可直接传入 `configure`：

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

上面的 API 适用于 node 端和浏览器端 (express 只适用于 node 端)，在 node 端 nunjucks 从文件系统加载模板，在浏览器端通过 http 加载模板。

If you [precompiled](api.html#precompiling) your templates in the browser, they will
automatically be picked up by the system and you don't have to do
anything different. This makes it easy to use the same code in
development and production, while only using precompiled templates in
production.

## 更多信息

这只是冰山一角，可继续查看 [API](api.html) 文档和[模板语言](templating.html)。

