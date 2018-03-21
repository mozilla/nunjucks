---
layout: subpage
title: Templates
---
{% raw %}

# 模板

这里包括 Nunjuck 所有可用的功能。

> Nunjucks 是
> [jinja2](http://jinja.pocoo.org/docs/) 的 javascript 的实现，所以如果此文档有什么缺失，你可以直接查看 [jinja2 的文档](http://jinja.pocoo.org/docs/templates/)，不过两者之间还存在一些[差异](http://mozilla.github.io/nunjucks/cn/faq.html)。

## 文件扩展名

虽然你可以用任意扩展名来命名你的Nunjucks模版或文件，但Nunjucks社区还是推荐使用`.njk`。

如果你在给Nunjucks开发工具或是编辑器上的语法插件时，请记得使用`.njk`扩展名。

## 变量

变量会从模板上下文获取，如果你想显示一个变量可以：

```jinja
{{ username }}
```

会从上下文查找 `username` 然后显示，可以像 javascript 一样获取变量的属性 (可使用点操作符或者中括号操作符)：

```jinja
{{ foo.bar }}
{{ foo["bar"] }}
```

如果变量的值为 `undefined` 或 `null` 将不显示，引用到 undefined 或 null 对象也是如此 (如 `foo` 为 undefined，`{{ foo }}`, `{{
foo.bar }}`, `{{ foo.bar.baz }}` 也不显示)。

## 过滤器

过滤器是一些可以执行变量的函数，通过管道操作符 (`|`) 调用，并可接受参数。

```jinja
{{ foo | title }}
{{ foo | join(",") }}
{{ foo | replace("foo", "bar") | capitalize }}
```

第三个例子展示了链式过滤器，最终会显示 "Bar"，第一个过滤器将 "foo" 替换成 "bar"，第二个过滤器将首字母大写。

Nunjucks 提供了一些[内置的过滤器](#内置的过滤器)，你也可以[自定义过滤器](api#custom-filters)。

## 模板继承

模板继承可以达到模板复用的效果，当写一个模板的时候可以定义 "blocks"，子模板可以覆盖他，同时支持多层继承。

如果有一个叫做 `parent.html` 的模板，如下所示：

```jinja
{% block header %}
This is the default content
{% endblock %}

<section class="left">
  {% block left %}{% endblock %}
</section>

<section class="right">
  {% block right %}
  This is more content
  {% endblock %}
</section>
```

然后再写一个模板继承他

```jinja
{% extends "parent.html" %}

{% block left %}
This is the left side!
{% endblock %}

{% block right %}
This is the right side!
{% endblock %}
```

以下为渲染结果

```jinja
This is the default content

<section class="left">
  This is the left side!
</section>

<section class="right">
  This is the right side!
</section>
```

你可以将继承的模板设为一个变量，这样就可以动态指定继承的模板。这个变量既可以是个指向模板文件的字符串，也可以是个模板编译后所生成的对象(需要添加上下文环境)。因此你可以通过设置上下文变量，从而在渲染时动态地改变所要继承的模板。

```jinja
{% extends parentTemplate %}
```

继承功能使用了 [`extends`](#extends) 和 [`block`](#block) 标签，[jinja2 文档](http://jinja.pocoo.org/docs/templates/#template-inheritance)中有更细节的描述。

### super

你可以通过调用`super`从而将父级区块中的内容渲染到子区块中。如果在前面的例子中你的子模板是这样的：

```jinja
{% block right %}
{{ super() }}
Right side!
{% endblock %}
```

这个区块的渲染结果将是：

```
This is more content
Right side!
```

## 标签

标签是一些特殊的区块，它们可以对模板执行一些操作。Nunjucks 包含一些内置的标签，你也可以[自定义](api.html#custom-tags)。

### if

`if` 为分支语句，与 javascript 中的 `if` 类似。

```jinja
{% if variable %}
  It is true
{% endif %}
```

如果 `variable` 定义了并且为 true _(译者注：这里并非布尔值，和 javascript 的处理是一样的)_ 则会显示 "It is true"，否则什么也不显示。

```jinja
{% if hungry %}
  I am hungry
{% elif tired %}
  I am tired
{% else %}
  I am good!
{% endif %}
```

在[内联表达式](#if-表达式)(inline expression)中也可以使用 if。

### for

`for` 可以遍历数组 (arrays) 和对象 (dictionaries)。

> 如果你使用的自定义模板加载器为异步的可查看 [`asyncEach`](#asynceach)

```js
var items = [{ title: "foo", id: 1 }, { title: "bar", id: 2}];
```

```jinja
<h1>Posts</h1>
<ul>
{% for item in items %}
  <li>{{ item.title }}</li>
{% else %}
  <li>This would display if the 'item' collection were empty</li>
{% endfor %}
</ul>
```

上面的示例通过使用`items`数组中的每一项的`title`属性显示了所有文章的标题。如果`items`数组是空数组的话则会渲染`else`语句中的内容。

你还可以遍历对象：

```js
var food = {
  'ketchup': '5 tbsp',
  'mustard': '1 tbsp',
  'pickle': '0 tbsp'
};
```

```jinja
{% for ingredient, amount in food %}
  Use {{ amount }} of {{ ingredient }}
{% endfor %}
```

[`dictsort`](http://jinja.pocoo.org/docs/templates/#dictsort) 过滤器可将对象排序 (*new in 0.1.8*)

除此之外，Nunjucks 会将数组解开，数组内的值对应到变量 (*new in 0.1.8*)

```js
var points = [[0, 1, 2], [5, 6, 7], [12, 13, 14]];
```

```jinja
{% for x, y, z in points %}
  Point: {{ x }}, {{ y }}, {{ z }}
{% endfor %}
```

在循环中可获取一些特殊的变量

* `loop.index`: 当前循环数 (1 indexed)
* `loop.index0`: 当前循环数 (0 indexed)
* `loop.revindex`: 当前循环数，从后往前 (1 indexed)
* `loop.revindex0`: 当前循环数，从后往前 (0 based)
* `loop.first`: 是否第一个
* `loop.last`: 是否最后一个
* `loop.length`: 总数

### asyncEach

> 这个是适用于异步模板，请读[文档](api.html#asynchronous-support)。

`asyncEach` 为 `for` 的异步版本，只有当使用[自定义异步模板加载器](#asynchronous)的时候才使用，否则请不要使用。异步过滤器和扩展也需要他。如果你在循环中使用了异步过滤器的话，Nunjucks就会在内部自动将循环转换成 `asyncEach`。

`asyncEach` 和 `for` 的使用方式一致，但他支持循环的异步控制。将两者区分的原因是性能，大部分人使用同步模板，将 `for` 转换成原生的 for 语句会快很多。

编译时 nunjuck 不用关心模板是如何加载的，所以无法决定 `include` 是同步或异步。这也是为什么Nunjucks无法自动将普通的循环语句转换成异步循环语句的原因，所以如果你要使用异步模板加载器的话，就需要使用 `asyncEach`。

```js
// If you are using a custom loader that is async, you need asyncEach
var env = new nunjucks.Environment(AsyncLoaderFromDatabase, opts);
```
```jinja
<h1>Posts</h1>
<ul>
{% asyncEach item in items %}
  {% include "item-template.html" %}
{% endeach %}
</ul>
```

### asyncAll

> 这个是适用于异步模板，请读[文档](api.html#asynchronous-support)。

`asyncAll` 和 `asyncEach` 类似，但 `asyncAll` 会并行的执行，并且每项的顺序仍然会保留。除非使用异步的过滤器、扩展或加载器，否则不要使用。

如果你写了一个 `lookup` 的过滤器用来从数据库获取一些文本，使用 `asyncAll` 可以并行渲染。

```jinja
<h1>Posts</h1>
<ul>
{% asyncAll item in items %}
  <li>{{ item.id | lookup }}</li>
{% endall %}
</ul>
```

如果 `lookup` 是一个异步的过滤器，那么可能会比较慢（如从磁盘获取些数据）。`asyncAll` 会减少执行的时间，他会并行执行所有的异步操作，当所有的操作完成后才会继续渲染页面。

### macro

宏 (`macro`) 可以定义可复用的内容，类似与编程语言中的函数，看下面的示例：

```jinja
{% macro field(name, value='', type='text') %}
<div class="field">
  <input type="{{ type }}" name="{{ name }}"
         value="{{ value | escape }}" />
</div>
{% endmacro %}
```

现在 `field` 可以当作函数一样使用了：

```jinja
{{ field('user') }}
{{ field('pass', type='password') }}
```

支持[关键字参数](#关键字参数)，通过链接查看具体使用方式。

还可以从其他模板 [import](#import) 宏，可以使宏在整个项目中复用。

**重要**：如果你使用异步 API，请注意你 **不能** 在宏中做任何异步的操作，因为宏只是像函数一样被简单地调用。将来我们可能会提供一种异步的宏调用方式，但现在这么使用是不被支持的。

### set

`set` 可以设置和修改变量。

```jinja
{{ username }}
{% set username = "joe" %}
{{ username }}
```

如果 `username` 初始化的时候为 "james', 最终将显示 "james joe"。

可以设置新的变量，并一起赋值。

```jinja
{% set x, y, z = 5 %}
```

如果在顶级作用域使用 `set`，将会改变全局的上下文中的值。如果只在某个作用域 (像是include或是macro) 中使用，则只会影响该作用域。

同样地，你也可以使用区块赋值将一个区块的内容储存在一个变量中。

它的语法和标准的`set`语法相似，只不过你不需要用`=`。区块中从头到`{% endset %}`之间的内容都会被捕获，并作为值来使用。

在某些情境下，你可以用这种语法来替代宏：

```jinja
{% set standardModal %}
    {% include 'standardModalData.html' %}
{% endset %}

<div class="js-modal" data-modal="{{standardModal | e}}">
```

### extends

`extends` 用来指定模板继承，被指定的模板为父级模板，查看[模板继承](#模板继承)。

```jinja
{% extends "base.html" %}
```

你可以将继承的模板设为一个变量，这样就可以动态指定继承的模板。这个变量既可以是个指向模板文件的字符串，也可以是个模板编译后所生成的对象(需要添加上下文环境)。因此你可以通过设置上下文变量，从而在渲染时动态地改变所要继承的模板。

```jinja
{% extends parentTemplate %}
```

`extends`也可以接受任意表达式，只要它最终返回一个字符串或是模板所编译成的对象：

```jinja
{% extends name + ".html" %}`.
```

### block

区块(`block`) 定义了模板片段并标识一个名字，在模板继承中使用。父级模板可指定一个区块，子模板覆盖这个区块，查看[模板继承](#模板继承)。

```jinja
{% block css %}
<link rel="stylesheet" href="app.css" />
{% endblock %}
```

可以在循环中定义区块

```jinja
{% for item in items %}
{% block item %}{{ item }}{% endblock %}
{% endfor %}
```

子模板可以覆盖 `item` 区块并改变里面的内容。

```jinja
{% extends "item.html" %}

{% block item %}
The name of the item is: {{ item.name }}
{% endblock %}
```

在区块中，你可以调用特殊的`super`函数。它会渲染父级区块中的内容。具体请查看[super](#super)。

### include

`include` 可引入其他的模板，可以在多模板之间共享一些小模板，如果某个模板已使用了继承那么 `include` 将会非常有用。

```jinja
{% include "item.html" %}
```

可在循环中引入模板

```jinja
{% for item in items %}
{% include "item.html" %}
{% endfor %}
```

这一点可以帮助我们把模板切分成更小的部分，从而使得在浏览器上，当我们需要改变页面时，我们可以渲染这些小部分的模板，而非一整个的大的模板。

`include` 可以接受任意表达式，只要它最终返回一个字符串或是模板所编译成的对象: `{% include name + ".html" as obj %}`.

在某些情况下，我们可能希望在模板文件不存在时不要抛出异常。对于这类情况，我们可以使用`ignore missing`来略过这些异常：

```jinja
{% include "missing.html" ignore missing %}
```

被包含的模版自身可以扩展(`extends`)另一个模版（因此你可以让一系列相关联的模版继承同一种结构）。
一个被包含的模版并不会改变包含它的模版的区块结构，它有一个分离的继承树和块级命名空间。换言之，
在渲染时，`include`并不 _不是_ 将被包含模版代码拉取到包含它的模版中的预处理器。相对的，它对被
包含的模版触发了一次的分离渲染，然后再将渲染的结果引入。

### import

`import` 可加载不同的模板，可使你操作模板输出的数据，模板将会输出宏 (macro) 和在顶级作用域进行的赋值 (使用 [`set`](#set))。

被 import 进来的模板没有当前模板的上下文，所以无法使用当前模板的变量，

创建一个叫 `forms.html` 如下所示

```jinja
{% macro field(name, value='', type='text') %}
<div class="field">
  <input type="{{ type }}" name="{{ name }}"
         value="{{ value | escape }}" />
</div>
{% endmacro %}

{% macro label(text) %}
<div>
  <label>{{ text }}</label>
</div>
{% endmacro %}
```

我们可以 import 这个模板并将模板的输出绑定到变量 `forms` 上，然后就可以使用这个变量了：


```jinja
{% import "forms.html" as forms %}

{{ forms.label('Username') }}
{{ forms.field('user') }}
{{ forms.label('Password') }}
{{ forms.field('pass', type='password') }}
```

也可以使用 `from import` 从模板中 import 指定的值到当前的命名空间：

```jinja
{% from "forms.html" import input, label as description %}

{{ description('Username') }}
{{ input('user') }}
{{ description('Password') }}
{{ input('pass', type='password') }}
```

`import` 可以接受任意表达式，只要它最终返回一个字符串或是模板所编译成的对象: `{% import name + ".html" as obj %}`.

### raw

如果你想输出一些 Nunjucks 特殊的标签 (如 `{{`)，可以使用 `{% raw %}` 将所有的内容输出为纯文本。

### filter

`filter`区块允许我们使用区块中的内容来调用过滤器。不同于使用`|`语法，它会将区块渲染出的内容传递给过滤器。

```jinja
{% filter title %}
may the force be with you
{% endfilter %}

{% filter replace("force", "forth") %}
may the force be with you
{% endfilter %}
```

切记：你不能在这些区块中进行任何异步操作。

### call

`call`区块允许你使用标签之间的内容来调用一个宏。这在你需要给宏传入大量内容时是十分有用的。在宏中，你可以通过`caller()`来获取这些内容。

```jinja
{% macro add(x, y) %}
{{ caller() }}: {{ x + y }}
{% endmacro%}

{% call add(1, 2) -%}
The result is
{%- endcall %}
```

上面的例子将会输出"The result is: 3"。

## 关键字参数

jinja2 使用 Python 的关键字参数，支持函数，过滤器和宏。Nunjucks 会通过一个调用转换 (calling convention) 来支持。

关键字参数如下：

```jinja
{{ foo(1, 2, bar=3, baz=4) }}
```

`bar` 和 `baz` 为关键字参数，Nunjucks 将他们转换成一个对象作为最后一个参数传入，等价于 javascript 的如下调用：

```js
foo(1, 2, { bar: 3, baz: 4})
```

因为这使一个标准的调用转换，所以适用于所有的符合预期的函数和过滤器。查看 [API 章节](api#Keyword-Arguments)获得更多信息。

定义宏的时候也可以使用关键字参数，定义参数值时可设置默认值。Nunjucks 会自动将关键字参数与宏里定义的值做匹配。

```jinja
{% macro foo(x, y, z=5, w=6) %}
{{ x }}, {{ y }}, {{ z }}, {{ w}}
{% endmacro %}

{{ foo(1, 2) }}        -> 1, 2, 5, 6
{{ foo(1, 2, w=10) }}  -> 1, 2, 5, 10
```

在宏中还可以混合使用位置参数 (positional arguments) 和关键字参数。如示例，你可以将位置参数用作关键字参数：

```jinja
{{ foo(20, y=21) }}     -> 20, 21, 5, 6
```

你还可以用位置参数来替换关键字参数：

```jinja
{{ foo(5, 6, 7, 8) }}   -> 5, 6, 7, 8
```

如下示例，你可以跳过 ("skip") 位置参数：

```jinja
{{ foo(8, z=7) }}      -> 8, , 7, 6
```

## 注释

你可以使用 `{#` and `#}` 来写注释，渲染时将会去除所有的注释。

```jinja
{# Loop through all the users #}
{% for user in users %}...{% endfor %}
```

## 空白字符控制

模板在正常情况会将变量 (variable) 和标签区块 (tag blocks) 周围的空白字符完全输出。有时，你不想输出一些额外的空白字符，但代码又需要一些空白字符来显得整洁。

你可以在开始和结束区块 (start or end block tag) 添加 (`-`) 来去除前面和后面的空白字符。

```jinja
{% for i in [1,2,3,4,5] -%}
  {{ i }}
{%- endfor %}
```

上面准确的输出为 "12345"，`-%}` 会去除标签右侧的空白字符，`{%-` 会去除标签之前的空白字符。

## 表达式

你可以使用和 javascript 一样的字面量。

* Strings: `"How are you?"`, `'How are you?'`
* Numbers: `40`, `30.123`
* Arrays: `[1, 2, "array"]`
* Dicts: `{ one: 1, two: 2 }`
* Boolean: `true`, `false`

### 运算 (Math)

Nunjucks 支持运算 (但尽量少用，把逻辑放在代码中)，可使用以下操作符：

* Addition: `+`
* Subtraction: `-`
* Division: `/`
* Division and integer truncation: `//`
* Division remainder: `%`
* Multiplication: `*`
* Power: `**`

可以如下使用：

```jinja
{{ 2 + 3 }}       (outputs 5)
{{ 10/5 }}        (outputs 2)
{{ numItems*2 }}
```

### 比较 (Comparisons)

* `==`
* `===`
* `!=`
* `!==`
* `>`
* `>=`
* `<`
* `<=`

Examples:

```jinja
{% if numUsers < 5 %}...{% endif %}
{% if i == 0 %}...{% endif %}
```

### Logic

* `and`
* `or`
* `not`
* 可使用大括号来分组

Examples:

```jinja
{% if users and showUsers %}...{% endif %}
{% if i == 0 and not hideFirst %}...{% endif %}
{% if (x < 5 or y < 5) and foo %}...{% endif %}
```

### If 表达式

和 javascript 的三元运算符 (ternary operator) 一样，可使用 if 的内联表达式：

```jinja
{{ "true" if foo else "false" }}
```

当 foo 为 true 的时候最终输出 "true" 否则为 "false"，对于获取默认值的时候非常有用：

```jinja
{{ baz(foo if foo else "default") }}
```

### 函数调用 (Function Calls)

如果你传入一个函数，则可以直接调用

```jinja
{{ foo(1, 2, 3) }}
```

### 正则表达式

你可以像在JavaScript中一样创建一个正则表达式:

```jinja
{{ /^foo.*/ }}
{{ /bar$/g }}
```

正则表达式所支持的标志如下。查阅[Regex on MDN](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp)以获取更多信息。

* `g`: 应用到全局
* `i`: 不区分大小写
* `m`: 多行模式
* `y`: 粘性支持（sticky）

## 自动转义 (Autoescaping)

如果在环境变量中设置了 autoescaping，所有的输出都会自动转义，但可以使用 `safe` 过滤器，Nunjucks 就不会转义了。

```jinja
{{ foo }}           // &lt;span%gt;
{{ foo | safe }}    // <span>
```

如果未开启 autoescaping，所有的输出都会如实输出，但可以使用 `escape` 过滤器来转义。

```jinja
{{ foo }}           // <span>
{{ foo | escape }}  // &lt;span&gt;
```

## 全局函数 (Global Functions)

以下为一些内置的全局函数

### range([start], stop, [step])

如果你需要遍历固定范围的数字可以使用 `range`，`start` (默认为 0) 为起始数字，`stop` 为结束数字，`step` 为间隔 (默认为 1)。

```jinja
{% for i in range(0, 5) -%}
  {{ i }},
{%- endfor %}
```

上面输出 `0,1,2,3,4`.

### cycler(item1, item2, ...itemN)

`cycler` 可以循环调用你指定的一系列的值。

```jinja
{% set cls = cycler("odd", "even") %}
{% for row in rows %}
  <div class="{{ cls.next() }}">{{ row.name }}</div>
{% endfor %}
```

上面的例子中奇数行的 class 为 "odd"，偶数行的 class 为 "even"。你可以使用`current`属性来获取当前项（在上面的例子中对应`cls.current`）。

### joiner([separator])

当合并多项的时候，希望在他们之间又分隔符 (像逗号)，但又不希望第一项也输出。`joiner` 将输出分割符 (默认为 ",") 除了第一次调用。

```jinja
{% set comma = joiner() %}
{% for tag in tags -%}
  {{ comma() }} {{ tag }}
{%- endfor %}
```

如果 `tags` 为 `["food", "beer", "dessert"]`, 上面将输出 `food, beer, dessert`。

## 内置的过滤器

Nunjucks已经实现了jinja中的大部分过滤器，同时也新增了一些属于自己的过滤器。
我们需要为这些过滤器编写文档。下面是一部分过滤器的文档，其他的你可以点击链接查看jinja上的文档。

### default(value, default, [boolean])

(简写为 `d`)

如果`value`全等于`undefined`则返回`default`，否则返回`value`。
如果`boolean`为true，则会在`value`为JavaScript中的假值时（比如：false, ""等）返回`default`。

**在2.0版本中，这个过滤器的默认表现与以前有所不同。在之前的版本中，它会把`boolean`的默认值
  设置为true，所以传入任何假值都会返回`default`。在2.0中，默认只有值为`undefined`时会
  返回`default`。如果你仍旧希望保持原来版本的表现的话，你可以给`boolean`传入`true`，或是
  直接使用`value or default`。**

### sort(arr, reverse, caseSens, attr)

用JavaScript中的`arr.sort`函数排序`arr`。如果`reverse`为true，则会返回相反的
排序结果。默认状态下排序不会区分大小写，但你可以将`caseSens`设置为true来让排序
区分大小写。我们可以用`attr`来指定要比较的属性。

### striptags (value, [preserve_linebreaks])

类似于jinja中的[striptags](http://jinja.pocoo.org/docs/templates/#striptags).
如果`preserve_linebreaks`为false（同时也是默认值），则会移去SGML/XML标签并用一个空格符
替换临近的、连续的空白符号。如果`preserve_linebreaks`为true，则会尝试保留临近的空白符号。
如果你希望使用管道操作符进行类似于`{{ text | striptags | nl2br }}`这样的操作时，你就会
需要用到后一种。否则你还是应该使用默认的用法。

### dump (object)

在一个对象上调用`JSON.stringify`，并将结果输出到模板上。这在调试时很有用：`{{ foo | dump }}`。

### 其他过滤器

* [abs](http://jinja.pocoo.org/docs/templates/#abs)
* [batch](http://jinja.pocoo.org/docs/templates/#batch)
* [capitalize](http://jinja.pocoo.org/docs/templates/#capitalize)
* [center](http://jinja.pocoo.org/docs/templates/#center)
* [dictsort](http://jinja.pocoo.org/docs/templates/#dictsort)
* [escape](http://jinja.pocoo.org/docs/templates/#escape) (简写为`e`)
* [float](http://jinja.pocoo.org/docs/templates/#float)
* [first](http://jinja.pocoo.org/docs/templates/#first)
* [groupby](http://jinja.pocoo.org/docs/templates/#groupby)
* [indent](http://jinja.pocoo.org/docs/templates/#indent)
* [int](http://jinja.pocoo.org/docs/templates/#int)
* [join](http://jinja.pocoo.org/docs/templates/#join)
* [last](http://jinja.pocoo.org/docs/templates/#last)
* [length](http://jinja.pocoo.org/docs/templates/#length)
* [list](http://jinja.pocoo.org/docs/templates/#list)
* [lower](http://jinja.pocoo.org/docs/templates/#lower)
* [random](http://jinja.pocoo.org/docs/templates/#random)
* [rejectattr](http://jinja.pocoo.org/docs/templates/#rejectattr) (只接受单个参数)
* [replace](http://jinja.pocoo.org/docs/templates/#replace) (第一个参数也可以接受
  JavaScript中的正则表达式)
* [reverse](http://jinja.pocoo.org/docs/templates/#reverse)
* [round](http://jinja.pocoo.org/docs/templates/#round)
* [safe](http://jinja.pocoo.org/docs/templates/#safe)
* [selectattr](http://jinja.pocoo.org/docs/templates/#selectattr) (只接受单个参数)
* [slice](http://jinja.pocoo.org/docs/templates/#slice)
* [string](http://jinja.pocoo.org/docs/templates/#string)
* [sum](http://jinja.pocoo.org/docs/dev/templates/#sum)
* [title](http://jinja.pocoo.org/docs/templates/#title)
* [trim](http://jinja.pocoo.org/docs/templates/#trim)
* [truncate](http://jinja.pocoo.org/docs/templates/#truncate)
* [upper](http://jinja.pocoo.org/docs/templates/#upper)
* [urlencode](http://jinja.pocoo.org/docs/templates/#urlencode)
* [urlize](http://jinja.pocoo.org/docs/templates/#urlize)
* [wordcount](http://jinja.pocoo.org/docs/templates/#wordcount)

你也可以直接[看代码](https://github.com/mozilla/nunjucks/blob/master/nunjucks/src/filters.js)。

{% endraw %}
