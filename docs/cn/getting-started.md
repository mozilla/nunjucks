---
layout: subpage
pageid: getting-started
---

# 快速上手

## Node 端使用

```
$ npm install govjucks
```

下载后可直接 `require('govjucks')` 使用

## 浏览器端使用

可直接使用 [govjucks.js](files/govjucks.js) ([min](files/govjucks.min.js))，如果针对编译后的模板可使用 [govjucks-slim.js](files/govjucks-slim.js) ([min](files/govjucks-slim.min.js))。

### 你应该使用哪个文件

* **govjucks.js** 可用于动态加载模板，当模板变化时重新加载，也可以用于预编译后的模板。包含编译器，所以会比较大 (20K min/gzipped)。如果你刚接触 govjucks 可使用这个文件，如果你不在意大小也可以在生产环境使用。

* **govjucks-slim.js** 只能用于预编译后的模板，只包含运行时的代码，所以比较小 (8K min/gzipped)。一般用于生产环境，如果你使用 [grunt](https://github.com/jlongster/grunt-govjucks) 或[gulp](https://github.com/sindresorhus/gulp-govjucks)任务自动预编译，也可以在开发环境使用。

直接用 `script` 引入文件：

```html
<script src="govjucks.js"></script>
```

或者可以作为一个 AMD 模块加载：

```js
define(['govjucks'], function(govjucks) {
});
```

> 确保在生产环境使用预编译版本，可使用 [grunt
> ](https://github.com/jlongster/grunt-govjucks)或[gulp](https://github.com/sindresorhus/gulp-govjucks)，可在 [浏览器使用](api.html#browser-usage) 查看客户端优化的配置。

## 使用说明

这是最简单使用 govjucks 的方式，首先设置配置项(如 autoescaping)，然后渲染一个字符串：

```js
govjucks.configure({ autoescape: true });
govjucks.renderString('Hello {% raw %}{{ username }}{% endraw %}', { username: 'James' });
```

`renderString` 并不常用，而是使用 `render` 来直接渲染文件，这种方式支持继承(extends)和包含(include)模板。使用之前需要配置文件的路径：

```js
govjucks.configure('views', { autoescape: true });
govjucks.render('index.html', { foo: 'bar' });
```

在 node 端，`'views'` 为相对于当前工作目录 (working
directory) 的路径。在浏览器端则为一个相对的 url，最好指定为绝对路径 (如 `'/views'`)。

如果使用 express 可直接传入 `configure`：

```js
var app = express();

govjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function(req, res) {
    res.render('index.html');
});
```

上面的 API 适用于 node 端和浏览器端 (express 只适用于 node 端)，在 node 端 govjucks 从文件系统加载模板，在浏览器端通过 http 加载模板。

如果你在浏览器上使用[编译后](api.html#precompiling)的模板的话，你不需要额外做其他的事情系统也能够理解它们。这使得我们可以轻松地在开发环境和生产环境上使用同一份代码，并在生产环境上只使用已经编译过的模板。

## 更多信息

这只是冰山一角，可继续查看 [API](api.html) 文档和[模板语言](templating.html)。
