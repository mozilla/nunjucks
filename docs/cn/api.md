---
layout: subpage
title: API
---
{% raw %}

# API

Nunjucks 的 API 包括渲染模板，添加过滤器和扩展，自定义模板加载器等等。

## Simple API

如果你不需要深度定制，可以直接使用初级(higher-level) api 来加载和渲染模板。

{% endraw %}
{% api %}
render
nunjucks.render(name, [context], [callback])

渲染模式时需要两个参数，模板名 **name** 和数据 **context**。如果 **callback** 存在，当渲染完成后会被调用，第一个参数是错误，第二个为返回的结果；如果不存在，`render` 方法会直接返回结果，错误时会抛错。更多查看[异步的支持](#asynchronous-support)。

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

与 [`render`](#render) 类似，只是渲染一个字符串而不是渲染加载的模板。

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
configure
nunjucks.configure([path], [opts]);

传入 **path** 指定存放模板的目录，**opts** 可让某些功能开启或关闭，这两个变量都是可选的。**path** 的默认值为当前的工作目录，**opts** 提供以下功能：

* **watch** *(默认值: true)* 当模板变化时重新加载
* **express** 传入 express 实例初始化模板设置
* **autoescape** *(默认值: false)* 控制输出是否被转义，查看 [Autoescaping](#autoescaping)
* **tags:** *(默认值: see nunjucks syntax)* 定义模板语法，查看 [Customizing Syntax](#customizing-syntax)

`configure` 返回一个 `Environment` 实例, 他提供了简单的 api 添加过滤器 (filters) 和扩展 (extensions)，可在 `Environment` 查看更多的使用方法。

```js
nunjucks.configure('views');

// 在浏览器端最好使用绝对地址
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

就是这么简单，如果希望自己定义模板加载等更多的个性化设置，那么可以继续往下看。

## Environment

`Environment` 类用来管理模板，使用他可以加载模板，模板之间可以继承和包含，上面提到的 api 都是调用了 `Environment` 的 api。

你可以根据需要来定制，比如定制模板加载。

{% endraw %}
{% api %}
constructor
new Environment([loaders], [opts])

实例化 `Environment` 时传入两个参数，一组 **loaders** 和配置项 **opts**。如果 **loaders** 不存在，则默认从当前目录或地址加载。**loaders** 可为一个或多个，如果传入一个数组，nunjucks 会按顺序查找直到找到模板。更多查看 [`Loader`](#loader)

**opts** 的配置有 **autoescape** and **tags**，在 [`configure`](#configure) 查看具体配置（express 和 watch 配置在这里不适用，而是在 [`env.express`](#express) 进行配置）。

在 node 端使用 [`FileSystemLoader`](#filesystemloader) 加载模板，浏览器端则使用 [`WebLoader`](#webloader) 通过 http 加载（或使用编译后的模板）。如果你使用了 [`configure`](#configure) 的 api，nunjucks 会根据平台（node 或浏览器）自动选择对应的 loader。查看更多 [`Loader`](#loader)。

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

渲染名为 **name** 的模板，使用 **context** 作为数据，如果 **callback** 存在，在完成时会调用，回调有两个参数：错误和结果（ 查看 [asynchronous support](#asynchronous-support)）。如果 **callback** 不存在则直接回返结果。

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

和 [`render`](#render1) 相同，只是渲染一个字符串而不是加载的模块。

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
addFilter
env.addFilter(name, func, [async])

添加名为 **name** 的自定义过滤器，**func** 为调用的函数，如果过滤器需要异步的，**async** 应该为 `true` （查看 [asynchronous support](#asynchronous-support))。查看 [Custom Filters](#custom-filters)。

{% endapi %}

{% api %}
getFilter
env.getFilter(name)

获取过滤器，传入名字返回一个函数。

{% endapi %}

{% api %}
addExtension
env.addExtension(name, ext)

添加一个名为 **name** 的扩展，**ext** 为一个对象，并存在几个指定的方法供系统调用，查看 [Custom Tags](#custom-tags)。

{% endapi %}

{% api %}
getExtension
env.getExtension(name)

获取扩展，传入名字返回一个函数。

{% endapi %}

{% api %}
addGlobal
env.addGlobal(name, value)

添加一个全局变量，可以在所有模板使用。注意：这个会覆盖已有的 `name` 变量。
{% endapi %}

{% api %}
getTemplate
env.getTemplate(name, [eagerCompile], [callback])

获取一个名为 **name** 的模板。如果 **eagerCompile** 为 `true`，模板会立即编译而不是在渲染的时候再编译。如果 **callback** 存在会被调用，参数为错误和模板，否则会直接返回。如果使用异步加载器，则必须使用异步的 api，内置的加载器不需要。查看 [asynchronous support](#asynchronous-support) 和 [loaders](#loader)。

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

使用 nunjucks 作为 express 的模板引擎，调用后可正常使用 express。你也可以调用 [`configure`](#configure)，将 app 作为 express 参数传入。

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

`Template` 是一个模板编译后的对象，然后进行渲染。通常情况下，`Environment` 已经帮你处理了，但你也可以自己进行处理。
如果使用 `Template` 渲染模板时未指定 `Environment`，那么这个模板不支持包含 (include) 和继承 (inherit) 其他模板。

{% endraw %}
{% api %}
constructor
new Template(src, [env], [path], [eagerCompile])

实例化 `Template` 时需要四个参数，**src** 为模板的字符串，`Environment` 的实例 **env**（可选）用来加载其他模板，**path** 为一个路径，在调试中使用，如果 **eagerCompile** 为 `true`，模板会立即编译而不是在渲染的时候再编译。

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

渲染模板，**context** 为数据，如果 **callback** 存在会在渲染完成后调用，参数为错误和结果 (查看 [asynchronous support](#asynchronous-support))，否则直接返回。

{% endapi %}
{% raw %}

## Loader

加载器是一个对象，从资源（如文件系统或网络）中加载模板，以下为两个内置的加载器。
A loader is an object that takes a template name and loads it from a
source, such as the filesystem or network. The following two builtin
loaders exist, each for different contexts.

{% endraw %}
{% api %}
FileSystemLoader
new FileSystemLoader([searchPaths], [noWatch])

只在 node 端可用，他可从文件系统中加载模板，**searchPaths** 为查找模板的路径，可以是一个也可以是多个，默认为当前的工作目录。如果 **noWatch** 为 `true`，模板会永久缓存，否则使用 `fs.watch` 来监听文件的变化。

```js
// Loads templates from the "views" folder
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
```

{% endapi %}

{% api %}
WebLoader
new WebLoader([baseURL], [neverUpdate])

只在浏览器端可用，通过 **baseURL**（必须为同域）加载模板，默认为当前相对目录。如果 **neverUpdate** 为 `true`，模板只会加载一次，以后不会变化，默认每次渲染的时候都会加载。

他还能加载预编译后的模板，自动使用这些模板而不是通过 http 获取，在生产环境应该使用预编译。查看 [Precompiling Templates](#precompiling-templates)。

```js
// Load templates from /views
var env = new nunjucks.Environment(new nunjucks.WebLoader('/views'))
```
{% endapi %}
{% raw %}

### Writing a Loader

你可以自己写一个更复杂一点的加载器（如从数据库加载），只需建一个对象，添加一个 `getSource(name)` 的方法，**name** 为模板名。

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

如果你希望跟踪模板的更新，并当有更新时清除缓存，这样就有一点复杂了。但你可以继承 `Loader` 类，可以通过 `emit` 方法触发事件。

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

这是最后一部分：异步加载器。到现在为止，所有的加载器都是同步，`getSource` 立即返回资源。这个的好处是用户不必强制使用异步 api，也不用担心异步模板的边缘问题。但是，你可以希望从数据库加载

只需在 load 中添加 `async: true` 属性就可支持异步调用

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

记住现在必须使用异步 api，查看 [asynchronous support](#asynchronous-support)。


**注意**: 如果使用了异步加载器，你将不能在 `for` 循环中加载模块，但可以使用 `asyncEach` 替换之。`asyncEach` 和 `for` 相同，只是在异步的时候使用。更多查看 [Be Careful!](#be-careful)。

## Browser Usage

在浏览器端使用 nunjucks 需要考虑更多，因为需要非常关注加载和编译时间。在服务端，模板一次编译后就缓存在内存中，就不用担心了。在浏览器端，你甚至不想编译他，因为会降低渲染的速度。

解决方案是将模板预编译成 javascript，和普通的 js 一样加载。

可能你想在开发时动态的加载模板，这样你可以在文件变化的时候马上看到而不需要预编译。Nunjucks 已经帮你适配了你想要的工作流。

有一点必须遵守：**在生产环境一定要预编译模板**。为什么？不仅因为在页面加载时编译模板速度很慢，而且是**同步**加载模板的，会阻塞整个页面。这很慢，因为 nunjucks 模板不是异步的。

### Recommended Setups

在客户端，有两种最常用的方式来初始设置 nunjucks。注意这是两个不同的文件，其中一个包括编译器 nunjucks.js，另一个不包括 nunjucks-slim.js。查看 [Getting Started](getting-started.html) 区分两者。

查看 [Precompiling](#precompiling) 了解预编译。

#### Setup #1: only precompile in production

这个方法可以让你在开发环境可以动态加载模板（可以马上看到变化），在生产环境使用预编译的模板。

1. 使用 script 或模块加载器加载 [nunjucks.js](files/nunjucks.js)。
2. 渲染模板 ([example](#simple-api))!
3. 当发布到生产环境时，When pushing to production, 将模板[预编译](#precompiling) 成 js 文件。

> 在生产环境中，你可以使用 `nunjucks-slim.js` 代替 `nunjucks.js` 进行优化，因为你使用了预编译的模板。
> `nunjucks-slim.js` 只有 8K 而不是 20K，因为不包括编译器。
> 但是这使初始设置复杂化了，因为在开发和生产环境需要不同的 js 文件，是否值得完全在你如何使用。

#### Setup #2: always precompile

这个方法是在开发和生产环境都使用预编译的模板，这样可以简化初始设置。但是在开发时，你需要一些工具来自动预编译，而不是手动编译。

1. 开发时，使用 [grunt task](https://github.com/jlongster/grunt-nunjucks) 监听文件目录，当文件变化后自动编译成 js 文件。
2. 使用 script 或模块加载器加载 [nunjucks-slim.js](files/nunjucks-slim.js) 和你编译的 js 文件（如 `templates.js`）。
3. 渲染模板 ([example](#simple-api))!

使用这个方法，开发和生产环境无区别，只需提交 templates.js 并部署到生产环境。

## Precompiling

使用 `nunjucks-precompile` 脚本来预编译模板，可传入一个目录或一个文件，他将把所有的模板生成 javascript。

```
// Precompiling a whole directory
$ nunjucks-precompile views > templates.js

// Precompiling individual templates
$ nunjucks-precompile views/base.html >> templates.js
$ nunjucks-precompile views/index.html >> templates.js
$ nunjucks-precompile views/about.html >> templates.js
```

你只需要在页面上加载 `templates.js`，系统会自动使用预编译的模板，没有改变的必要。

这个脚本还有很多可选项，直接调用 `nunjucks-precompile` 可以看到更多信息。注意**所有的异步过滤器需要当参数传入**，因为编译时需要他们，你可以使用 `-a` 参数来传入（如 `-a foo,bar,baz`）。如果只使用同步过滤器则不需要处理。

这个脚本无法指定扩展，所以你需要使用如下的预编译 api。

### API

如果你希望通过代码来预编译模板，nunjucks 也提供了 api，特别是在使用扩展和异步过滤器的时候需要使用这些 api。可以将 `Environment` 的实例传给预编译器，其中将包括扩展和过滤器。你需要在客户端和服务器使用同一个 `Environment` 对象保证同步。

{% endraw %}
{% api %}
precompile
nunjucks.precompile(path, [opts])

传入 **path** 预编译一个文件或目录，**opts** 为如下的一些配置：

* **name**: 模板的名字，当编译一个字符串的时候需要，如果是一个文件则是可选的（默认为 **path**）,如果是目录名字会自动生成。
* **asFunction**: 生成一个函数
* **force**: 如果出错还继续编译
* **env**: `Environment` 的实例
* **include**: 包括额外的文件和文件夹 (folders are auto-included, files are auto-excluded)
* **exclude**: 排除额外的文件和文件夹 (folders are auto-included, files are auto-excluded)

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

和 [`precompile`](#precompile) 相同，只是编译字符串。

{% endapi %}
{% raw %}

## Asynchronous Support

如果你对异步渲染感兴趣才需要看这节，并没有性能上的优势，只是支持异步的过滤器和扩展，如果你不关注异步，那么应该使用同步 api，如 `var res = env.render('foo.html');`。你不必每次都写 `callback`，这就是为什么在所有的渲染函数中是一个可选项。

nunjucks 1.0 会提供一种异步渲染模板的方式，这意味着自定义的过滤器和扩展可以做些类似从数据库获取内容的操作，模板渲染会等待直到调用回调。

模板加载器也可以异步，可使你从数据库或其他地方加载模板。查看 [Writing a Loader](#writing-a-loader)。如果你在使用一个异步的模板加载，你需要使用异步的 api。内置的加载器是同步的，但并没有性能问题，因为文件系统是可以缓存的，而浏览器端会将模板编译成 js。

如果你使用了异步的，那么你需要使用异步的 api：

```js
nunjucks.render('foo.html', function(err, res) {
   // check err and handle result
});
```

了解更多异步相关的查看 [`filters`](#asynchronous1), [`extensions`](#asynchronous2) 和
[`loaders`](#asynchronous).

### Be Careful!

Nunjucks 默认是同步的，因此你需要按照如下规则写异步模板：

* 总是使用异步 api，调用 `render` 方法时应该有回调。
* 在编译时需要提供异步过滤器和扩展，所以在预编译时(查看
  [Precompiling](#precompiling))需要指定。
* 如果你使用一个自定义的异步加载器，你不能在 `for` 中使用 include 模板，因为在 `for` 循环中会立即执行。而你需要使用 `asyncEach` 来循环，这和 `for` 的功能时相同的，但只用于异步场景。

## Autoescaping

在默认情况下，nunjuck 渲染时会按原样输出，如果开启了自动转义 (autoescaping)，nunjuck 会转义所有的输出，为了安全建议一直开启。

自动转义在 nunjucks 中非常简单，你只需将 `autoescape` 为 `true` 传入 `Environment` 对象。

```js
var env = nunjucks.configure('/path/to/templates', { autoescape: true });
```

## Customizing Syntax

如果你希望使用其他的 token 而不是 `{{`，其中包括变量、区块和注释，你可以使用 `tags` 来定义不同的 token：

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

使用这个 env，模板如下所示：

```
<ul>
<% for item in items %>
  <li><$ item $></li>
<% endfor %>
</ul>
```

## Custom Filters

使用 `Environment` 的 `addFilter` 方法添加一个自定义的过滤器，过滤器时一个函数，第一个参数为目标元素，剩下的参数为传入过滤器的参数。

```js
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
});
```

添加了一个 `shorten` 的过滤器，返回前 `count` 位数的字符，`count` 默认为 5，如下为如何使用：

```jinja
{# Show the first 5 characters #}
A message for you: {{ message|shorten }}

{# Show the first 20 characters #}
A message for you: {{ message|shorten(20) }}
```

### Keyword/Default Arguments

在[模板](templating#Keyword-Arguments)中说道，nunjucks 支持关键字参数，你可以在 filter 中使用他。

所有的关键字参数会以最后一个参数传入，以下为使用了关键字参数的 `foo` 过滤器：

```js
env.addFilter('foo', function(num, x, y, kwargs) {
   return num + (kwargs.bar || 10);
})
```

模板可如下使用：

```jinja
{{ 5 | foo(1, 2) }}          -> 15
{{ 5 | foo(1, 2, bar=3) }}   -> 8
```

你*必须*在关键字参数之前传入所有的位置参数 (`foo(1)` 是有效的，而 `foo(1, bar=10)` 不是)，你不能使用将一个位置参数当作关键字参数来用 (如 `foo(1, y=1)`)。

### Asynchronous

异步过滤器接受一个回调继续渲染，调用 `addFilter` 时需传入第三个参数 `true`。

```js
var env = nunjucks.configure('views');

env.addFilter('lookup', function(name, callback) {
    db.getItem(name, callback);
}, true);

env.render('{{ item|lookup }}', function(err, res) {
    // do something with res
});
```

回调需要两个参数 `callback(err, res)`，`err` 可以为 null。

注意：当预编译时，**你必须指定所有的异步过滤器**，查看 [Precompiling](#precompiling)。

## Custom Tags

你可以添加更多的自定义扩展，nunjucks 提供了 parser api 可以对模板做更多的事。

注意：当预编译时，**你必须在编译时添加这些扩展**，你应该使用 [precompiling API](#api1) (或者 [grunt task](https://github.com/jlongster/grunt-nunjucks))，而不是预编译脚本。你需要创建一个 [`Environment`](#environment)
 实例，添加扩展，传到预编译器中。

一个扩展至少有两个字段 `tags` 和 `parse`，扩展注册一个标签名，如果运行到这个标签则调用 parse。

`tags` 为这个扩展支持的一组标签名。`parse` 为一个函数，当编译时会解析模板。除此之外，还有一个特殊的节点名为 `CallExtension`，在运行时你可以调用本扩展的其他方法，下面会详细说明。

因为你需要直接使用 parse api，并且需要手动分析初 AST，所以有一点麻烦。如果你希望做一些复杂的扩展这是必须的。所以介绍一下你会用到的方法：

* `parseSignature([throwErrors], [noParens])` - 解析标签的参数。默认情况下，解析器会从括号左边解析到括号右边。但是自定义标签不应该时括号，所以将第二个参数设为 `true` 告诉解析器解析参数直到标签关闭。参数之间应该用逗号分隔，如 `{%
  mytag foo, bar, baz=10 %}`。

* `parseUntilBlocks(names)` - 解析内容直到下一个名为 `names` 的标签，非常有用解析标签之间的内容。

parser API 还需要更多的文档，但现在对照上面的文档和下面的例子，你还可以看下[源码](https://github.com/mozilla/nunjucks/blob/master/src/parser.js)。

最常用使用的是在运行时解析标签间的内容，就像过滤器一样，但是更灵活，因为不只是局限在一个表达式中。通常情况下你会解析模板，然后将内容传入回调。你可以使用 `CallExtension`，需要传扩展的实例，方法名，解析的参数和内容（使用 `parseUntilBlocks` 解析的）。

例如，下面实现了从远程获取内容并插入的扩展：

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
        var body = parser.parseUntilBlocks('error', 'endtruncate');
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

模板可以这么写：

```jinja
{% remote "/stuff" %}
  This content will be replaced with the content from /stuff
{% error %}
  There was an error fetching /stuff
{% endremote %}
```

### Asynchronous

如果是异步的可以使用 `CallExtensionAsync`，在运行时扩展有一个回调作为最后一个参数，模板渲染会等待回调返回。

上面例子中的 `run` 如下使用

```js
this.run = function(context, url, body, errorBody, callback) {
   // do async stuff and then call callback(err, res)
};
```

If you create anything interesting, make sure to
[add it to the wiki!](https://github.com/mozilla/nunjucks/wiki/Custom-Tags)

{% endraw %}
