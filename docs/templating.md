---
layout: subpage
title: Templates
---
{% raw %}

# Templating

This is an overview of the templating features available in Nunjucks.

> Nunjucks is essentially a port of
> [jinja2](http://jinja.pocoo.org/docs/), so you can read their
> [docs](http://jinja.pocoo.org/docs/templates/) if you find anything
> lacking here. Read about the differences
> [here](http://mozilla.github.io/nunjucks/faq.html#can-i-use-the-same-templates-between-nunjucks-and-jinja2-what-are-the-differences).

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

## File Extensions

Although you are free to use any file extension you wish for your
Nunjucks template files, the Nunjucks community has adopted  `.njk`.

If you are developing tools or editor syntax helpers for Nunjucks, please
include recognition of the `.njk` extension.

## Syntax Highlighting

Plugins are available in various editors to support the `jinja` syntax highlighting of Nunjucks.

* atom <https://github.com/alohaas/language-nunjucks>
* vim <https://github.com/niftylettuce/vim-jinja>
* brackets <https://github.com/axelboc/nunjucks-brackets>
* sublime <https://github.com/mogga/sublime-nunjucks/blob/master/Nunjucks.tmLanguage>
* emacs <http://web-mode.org>
* vscode <https://github.com/ronnidc/vscode-nunjucks>

## Variables

A variable looks up a value from the template context. If you wanted
to simply display a variable, you would do:

```jinja
{{ username }}
```

This looks up `username` from the context and displays it. Variable
names can have dots in them which lookup properties, just like
javascript. You can also use the square bracket syntax.

```jinja
{{ foo.bar }}
{{ foo["bar"] }}
```

These two forms to the exact same thing, just like javascript.

If a value is `undefined` or `null`, nothing is displayed. The same
behavior occurs when referencing undefined or null objects. The
following all output nothing if `foo` is undefined: `{{ foo }}`, `{{
foo.bar }}`, `{{ foo.bar.baz }}`.

## Filters

Filters are essentially functions that can be applied to variables.
They are called with a pipe operator (`|`) and can take arguments.

```jinja
{{ foo | title }}
{{ foo | join(",") }}
{{ foo | replace("foo", "bar") | capitalize }}
```

The third example shows how you can chain filters. It would display
"Bar", by first replacing "foo" with "bar" and then capitalizing it.

Nunjucks comes with several
[builtin filters](#builtin-filters), and you can
[add your own](api#custom-filters) as well.

## Template Inheritance

Template inheritance is a way to make it easy to reuse templates.
When writing a template, you can define "blocks" that child templates
can override. The inheritance chain can be as long as you like.

If we have a template `parent.html` that looks like this:

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

And we render this template:

```jinja
{% extends "parent.html" %}

{% block left %}
This is the left side!
{% endblock %}

{% block right %}
This is the right side!
{% endblock %}
```

The output would be:

```jinja
This is the default content

<section class="left">
  This is the left side!
</section>

<section class="right">
  This is the right side!
</section>
```

You can store the template to inherit in a variable and use it by
omitting quotes. This variable can contain a string that points to a
template file, or it can contain a compiled Template object that has
been added to the context. That way you can dynamically change
which template is inherited when rendering by setting it in the context.

```jinja
{% extends parentTemplate %}
```

You leverage inheritance with the [`extends`](#extends) and
[`block`](#block) tags. A more detailed explanation of inheritance can
be found in the [jinja2
docs](http://jinja.pocoo.org/docs/templates/#template-inheritance).

### super

You can render the contents of the parent block inside a child block
by calling `super`. If in the child template from above you had:

```jinja
{% block right %}
{{ super() }}
Right side!
{% endblock %}
```

The output of the block would be:

```
This is more content
Right side!
```

## Tags

Tags are special blocks that perform operations on sections of the template.
Nunjucks comes with several builtin, but [you can add your own](api.html#custom-tags).

### if

`if` tests a condition and lets you selectively display content. It behaves
exactly as javascript's `if` behaves.

```jinja
{% if variable %}
  It is true
{% endif %}
```

If variable is defined and evaluates to true, "It is true" will be
displayed. Otherwise, nothing will be.

You can specify alternate conditions with `elif` (or `elseif`, which is simply an alias of `elif`)
and `else`:

```jinja
{% if hungry %}
  I am hungry
{% elif tired %}
  I am tired
{% else %}
  I am good!
{% endif %}
```

You can specify multiple conditions with `and` and `or`:

```jinja
{% if happy and hungry %}
  I am happy *and* hungry; both are true.
{% endif %}

{% if happy or hungry %}
  I am either happy *or* hungry; one or the other is true.
{% endif %}
```

You can also use if as an [inline expression](#if-expression).

### for

`for` iterates over arrays and dictionaries.

> If you are using a custom template loader that is asynchronous, see
> [`asyncEach`](#asynceach))

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

The above example lists all the posts using the `title` attribute of each item
in the `items` array as the display value. If the `items` array were empty, the
contents of the optional `else` clause would instead be rendered.

You can also iterate over objects/hashes:

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

The [`dictsort`](http://jinja.pocoo.org/docs/templates/#dictsort) filter is
available for sorting objects when iterating over them.

ES iterators are supported, like the new builtin Map and Set. But also
anything implementing the iterable protocol.

```js
var fruits = new Map([
  ["banana", "yellow"],
  ["apple", "red"],
  ["peach", "pink"]
])
```

```jinja
{% for fruit, color in fruits %}
  Did you know that {{ fruit }} is {{ color }}?
{% endfor %}
```

Additionally, Nunjucks will unpack arrays into variables:

```js
var points = [[0, 1, 2], [5, 6, 7], [12, 13, 14]];
```

```jinja
{% for x, y, z in points %}
  Point: {{ x }}, {{ y }}, {{ z }}
{% endfor %}
```

Inside loops, you have access to a few special variables:

* `loop.index`: the current iteration of the loop (1 indexed)
* `loop.index0`: the current iteration of the loop (0 indexed)
* `loop.revindex`: number of iterations until the end (1 indexed)
* `loop.revindex0`: number of iterations until the end (0 based)
* `loop.first`: boolean indicating the first iteration
* `loop.last`: boolean indicating the last iteration
* `loop.length`: total number of items

### asyncEach

> This is only applicable to asynchronous templates. Read about
> them [here](api.html#asynchronous-support)

`asyncEach` is an asynchronous version of `for`. You only need this if
you are using a [custom template loader that is
asynchronous](#asynchronous); otherwise you will never need it. Async
filters and extensions also need this, but internally loops are
automatically converted into `asyncEach` if any async filters and
extensions are used within the loop.

`asyncEach` has exactly the same behavior of `for`, but it enables
asynchronous control of the loop. The reason those tags are separate
is performance; most people use templates synchronously and it's
much faster for `for` to compile to a straight JavaScript `for` loop.

At compile-time, Nunjucks is not aware how templates are loaded so
it's unable to determine if an `include` block is asynchronous or not.
That's why it can't automatically convert loops for you, and you must
use `asyncEach` for iteration if you are loading templates
asynchronously inside the loop.

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

> This is only applicable to asynchronous templates. Read about
> them [here](api.html#asynchronous-support)

`asyncAll` is similar to `asyncEach`, except it renders all the items
in parallel, preserving the order of the items. This is only helpful
if you are using asynchronous filters, extensions, or loaders.
Otherwise you should never use this.

Let's say you created a filter named `lookup` that fetches some text
from a database. You could then render multiple items in parallel with
`asyncAll`:

```jinja
<h1>Posts</h1>
<ul>
{% asyncAll item in items %}
  <li>{{ item.id | lookup }}</li>
{% endall %}
</ul>
```

If `lookup` is an asynchronous filter, it's probably doing something
slow like fetching something from disk. `asyncAll` allows you reduce
the time it would take to execute the loop sequentially by doing all
the async work in parallel, and the template rendering resumes once
all the items are done.

### macro

`macro` allows you to define reusable chunks of content. It is similar to a
function in a programming language. Here's an example:

```jinja
{% macro field(name, value='', type='text') %}
<div class="field">
  <input type="{{ type }}" name="{{ name }}"
         value="{{ value | escape }}" />
</div>
{% endmacro %}
```
Now `field` is available to be called like a normal function:

```jinja
{{ field('user') }}
{{ field('pass', type='password') }}
```

Keyword/default arguments are available. See
[keyword arguments](#keyword-arguments) for a more detailed explanation.

You can [import](#import) macros from other templates, allowing you to reuse
them freely across your project.

**Important note**: If you are using the asynchronous API, please be aware that
you **cannot** do anything asynchronous inside macros. This is because macros
are called like normal functions. In the future we may have a way to call a
function asynchronously. If you do this now, the behavior is undefined.

### set

`set` lets you create/modify a variable.

```jinja
{{ username }}
{% set username = "joe" %}
{{ username }}
```

If `username` was initially "james', this would print "james joe".

You can introduce new variables, and also set multiple at once:

```jinja
{% set x, y, z = 5 %}
```

If `set` is used at the top-level, it changes the value of the global template
context. If used inside scoped blocks like an include or a macro, it only
modifies the current scope.

It is also possible to capture the contents of a block into a variable using
block assignments.  The syntax is similar to the standard `set`, except that
the `=` is omitted, and everything until the `{% endset %}` is captured.

This can be useful in some situations as an alternative for macros:

```jinja
{% set standardModal %}
    {% include 'standardModalData.html' %}
{% endset %}

<div class="js-modal" data-modal="{{standardModal | e}}">
```

### extends

`extends` is used to specify template inheritance. The specified
template is used as a base template. See [Template
Inheritance](#template-inheritance).

```jinja
{% extends "base.html" %}
```

You can store the template to inherit in a variable and use it by
omitting quotes. This variable can contain a string that points to a
template file, or it can contain a compiled Template object that has
been added to the context. That way you can dynamically change which template is
inherited when rendering by setting it in the context.

```jinja
{% extends parentTemplate %}
```

In fact, `extends` accepts any arbitrary expression, so you can pass
anything into it, as long as that expression evaluates to a string or
a compiled Template object:

```jinja
{% extends name + ".html" %}`.
```

### block

`block` defines a section on the template and identifies it with a
name. This is used by template inheritance. Base templates can specify
blocks and child templates can override them with new content. See
[Template Inheritance](#template-inheritance).

```jinja
{% block css %}
<link rel="stylesheet" href="app.css" />
{% endblock %}
```

You can even define blocks within looping:

```jinja
{% for item in items %}
{% block item %}{{ item }}{% endblock %}
{% endfor %}
```

Child templates can override the `item` block and change how it is displayed:

```jinja
{% extends "item.html" %}

{% block item %}
The name of the item is: {{ item.name }}
{% endblock %}
```

A special function `super` is available within blocks which will
render the parent block's content. See [super](#super).

### include

`include` pulls in other templates in place. It's useful when you need to share
smaller chunks across several templates that already inherit other templates.

```jinja
{% include "item.html" %}
```

You can even include templates in the middle of loops:

```jinja
{% for item in items %}
{% include "item.html" %}
{% endfor %}
```

This is especially useful for cutting up templates into pieces so that the
browser-side environment can render the small chunks when it needs to change
the page.

`include` actually accepts any arbitrary expression, so you can pass anything
into it, as long as the expression evaluates to a string or a compiled Template
object: `{% include name + ".html" %}`.

It might be useful to not throw an error if a template does not exist. Use the
`ignore missing` option to suppress such errors.

```jinja
{% include "missing.html" ignore missing %}
```

Included templates can themselves `extend` another template (so you could have
a set of related includes that all inherit a common structure). An included
template does not participate in the block structure of its including template;
it has a totally separate inheritance tree and block namespace. In other words,
an `include` is _not_ a pre-processor that pulls the included template code
into the including template before rendering; instead, it fires off a separate
render of the included template, and the results of that render are included.

### import

`import` loads a different template and allows you to access its exported
values. Macros and top-level assignments (done with [`set`](#set)) are exported
from templates, allowing you to access them in a different template.

Imported templates are processed without the current context by default, so
they do not have access to any of the current template variables.

Let's start with a template called `forms.html` that has the following in it:

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

We can import this template and bind all of its exported values to a variable
so that we can use it:

```jinja
{% import "forms.html" as forms %}

{{ forms.label('Username') }}
{{ forms.field('user') }}
{{ forms.label('Password') }}
{{ forms.field('pass', type='password') }}
```

You can also import specific values from a template into the current namespace
with `from import`:

```jinja
{% from "forms.html" import field, label as description %}

{{ description('Username') }}
{{ field('user') }}
{{ description('Password') }}
{{ field('pass', type='password') }}
```

By adding `with context` to the end of an `import` directive, the imported
template is processed with the current context.

```jinja
{% from "forms.html" import field with context %}
```

`import` actually accepts any arbitrary expression, so you can pass anything
into it, as long as the expression evaluates to a string or a compiled Template
object: `{% import name + ".html" as obj %}`.

### raw

If you want to output any of the special Nunjucks tags like `{{`, you can use
a `{% raw %}` block and anything inside of it will be output as plain text.

### verbatim

`{% verbatim %}` has identical behavior as [`{% raw %}`](#raw). It is added for
compatibility with the [Twig `verbatim` tag](http://twig.sensiolabs.org/doc/tags/verbatim.html).

### filter

A `filter` block allows you to call a filter with the contents of the
block. Instead passing a value with the `|` syntax, the render
contents from the block will be passed.

```jinja
{% filter title %}
may the force be with you
{% endfilter %}

{% filter replace("force", "forth") %}
may the force be with you
{% endfilter %}
```

NOTE: You cannot do anything asynchronous inside these blocks.

### call

A `call` block enables you to call a macro with all the text inside the
tag. This is helpful if you want to pass a lot of content into a macro. The
content is available inside the macro as `caller()`.

```jinja
{% macro add(x, y) %}
{{ caller() }}: {{ x + y }}
{% endmacro%}

{% call add(1, 2) -%}
The result is
{%- endcall %}
```

The above example would output "The result is: 3".

## Keyword Arguments

jinja2 uses Python's keyword arguments support to allow keyword arguments in
functions, filters, and macros. Nunjucks supports keyword arguments as well by
introducing a new calling convention.

Keyword arguments look like this:

```jinja
{{ foo(1, 2, bar=3, baz=4) }}
```

`bar` and `baz` are keyword arguments. Nunjucks converts them into a hash and
passes it as the last argument. It's equivalent to this call in javascript:

```js
foo(1, 2, { bar: 3, baz: 4})
```

Since this is a standard calling convention, it works for all functions and
filters if they are written to expect them. [Read more](api#Keyword-Arguments)
about this in the API section.

Macros allow you to also use keyword arguments in the definition, which allows
you to specify default values. Nunjucks automatically maps the keyword
arguments to the ones defined with the macro.

```
{% macro foo(x, y, z=5, w=6) %}
{{ x }}, {{ y }}, {{ z }}, {{ w}}
{% endmacro %}

{{ foo(1, 2) }}        -> 1, 2, 5, 6
{{ foo(1, 2, w=10) }}  -> 1, 2, 5, 10
```

You can mix positional and keyword arguments with macros. For example, you can
specify a positional argument as a keyword argument:

```jinja
{{ foo(20, y=21) }}     -> 20, 21, 5, 6
```

You can also simply pass a positional argument in place of a keyword argument:

```jinja
{{ foo(5, 6, 7, 8) }}   -> 5, 6, 7, 8
```

In this way, you can "skip" positional arguments:

```jinja
{{ foo(8, z=7) }}      -> 8, , 7, 6
```

## Comments

You can write comments using `{#` and `#}`. Comments are completely stripped
out when rendering.

```jinja
{# Loop through all the users #}
{% for user in users %}...{% endfor %}
```

## Whitespace Control

Normally the template engine outputs everything outside of variable and tag
blocks verbatim, with all the whitespace as it is in the file. Occasionally you
don't want the extra whitespace, but you still want to format the template
cleanly, which requires whitespace.

You can tell the engine to strip all leading or trailing whitespace by adding a
minus sign (`-`) to the start or end block or a variable.

```jinja
{% for i in [1,2,3,4,5] -%}
  {{ i }}
{%- endfor %}
```

The exact output of the above would be "12345". The `{%-` strips the whitespace
right before the tag, and `-%}` the strips the whitespace right after the tag.

And the same is for variables: `{{-` will strip the whitespace before the variable,
and `-}}` will strip the whitespace after the variable.

## Expressions

You can use many types of literal expressions that you are used to in javascript.

* Strings: `"How are you?"`, `'How are you?'`
* Numbers: `40`, `30.123`
* Arrays: `[1, 2, "array"]`
* Dicts: `{ one: 1, two: 2 }`
* Boolean: `true`, `false`

### Math

Nunjucks allows you to operate on values (though it should be used sparingly,
as most of your logic should be in code). The following operators are
available:

* Addition: `+`
* Subtraction: `-`
* Division: `/`
* Division and integer truncation: `//`
* Division remainder: `%`
* Multiplication: `*`
* Power: `**`

You can use them like this:

```jinja
{{ 2 + 3 }}       (outputs 5)
{{ 10/5 }}        (outputs 2)
{{ numItems*2 }}
```

### Comparisons

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
* Use parentheses to group expressions

Examples:

```jinja
{% if users and showUsers %}...{% endif %}
{% if i == 0 and not hideFirst %}...{% endif %}
{% if (x < 5 or y < 5) and foo %}...{% endif %}
```

### If Expression

Similar to javascript's ternary operator, you can use `if` as if it were an
inline expression:

```jinja
{{ "true" if foo else "false" }}
```

The above outputs the string "true" if foo is truthy, otherwise "false". This
is especially useful for default values like so:

```jinja
{{ baz(foo if foo else "default") }}
```

Unlike javascript's ternary operator, the `else` is optional:

```jinja
{{ "true" if foo }}
```

### Function Calls

If you have passed a javascript method to your template, you can call it like
normal.

```jinja
{{ foo(1, 2, 3) }}
```

### Regular Expressions

A regular expression can be created just like JavaScript, but needs to be prefixed with `r`:

```jinja
{% set regExp = r/^foo.*/g %}
{% if regExp.test('foo') %}
  Foo in the house!
{% endif %}
```

The supported flags are the following. See
[Regex on MDN](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
for more information.

* `g`: apply globally
* `i`: case insensitive
* `m`: multiline
* `y`: sticky

## Autoescaping

If autoescaping is turned on in the environment, all output will automatically
be escaped for safe output. To manually mark output as safe, use the `safe`
filter. Nunjucks will not escape this output.

```jinja
{{ foo }}           // &lt;span%gt;
{{ foo | safe }}    // <span>
```

If autoescaping is turned off, all output will be rendered as it is. You can
manually escape variables with the `escape` filter.

```jinja
{{ foo }}           // <span>
{{ foo | escape }}  // &lt;span&gt;
```

## Global Functions

There are a few builtin global functions that cover some common cases.

### range([start], stop, [step])

If you need to iterate over a fixed set of numbers, `range` generates the set
for you. The numbers begin at `start` (default 0) and increment by `step`
(default 1) until it reaches `stop`, not including it.

```jinja
{% for i in range(0, 5) -%}
  {{ i }},
{%- endfor %}
```

The above outputs `0,1,2,3,4`.

### cycler(item1, item2, ...itemN)

An easy way to rotate through several values is to use `cycler`, which takes
any number of arguments and cycles through them.

```jinja
{% set cls = cycler("odd", "even") %}
{% for row in rows %}
  <div class="{{ cls.next() }}">{{ row.name }}</div>
{% endfor %}
```

In the above example, odd rows have the class "odd" and even rows have the
class "even". You can access the current item on the `current` property (in the
above example, `cls.current`).

### joiner([separator])

When combining multiple items, it's common to want to delimit them with
something like a comma, but you don't want to output the separator for the
first item. The `joiner` class will output `separator` (default ",") whenever
it is called except for the first time.

```jinja
{% set comma = joiner() %}
{% for tag in tags -%}
  {{ comma() }} {{ tag }}
{%- endfor %}
```

If `tags` was `["food", "beer", "dessert"]`, the above example would output `food, beer, dessert`.

## Builtin Filters

Nunjucks has ported most of [jinja's filters](http://jinja.pocoo.org/docs/dev/templates/#builtin-filters), and has a few of its own:

### abs

Return the absolute value of the argument:

**Input**

```jinja
{{ -3|abs }}
```

**Output**

```jinja
3
```

### batch

Return a list of lists with the given number of items:

**Input**

```jinja
{% set items = [1,2,3,4,5,6] %}
{% set dash = joiner("-") %}
{% for item in items | batch(2) %}
    {{ dash() }} {% for items in item %}
       {{ items }}
    {% endfor %}
{% endfor %}
```

**Output**

```jinja
12-34-56
```

### capitalize

Make the first letter uppercase, the rest lower case:

**Input**

```jinja
{{ "This Is A Test" | capitalize }}
```

**Output**

```jinja
This is a test
```


### center

Center the value in a field of a given width:

**Input**

```jinja
{{ "fooo" | center }}
```

**Output**

```jinja
fooo
```

### default(value, default, [boolean])

(aliased as `d`)

If `value` is strictly `undefined`, return `default`, otherwise `value`. If
`boolean` is true, any JavaScript falsy value will return `default` (false, "",
etc)

**In version 2.0, this filter changed the default behavior of this
  filter. Previously, it acted as if `boolean` was true by default, and any
  falsy value would return `default`. In 2.0 the default is only an `undefined`
  value returns `default`. You can get the old behavior by passing `true` to
  `boolean`, or just use `value or default`.**

### dictsort

Sort a dict and yield (key, value) pairs:

```jinja
{% set items = {
    'e': 1,
    'd': 2,
    'c': 3,
    'a': 4,
    'f': 5,
    'b': 6
} %}
{% for item in items | dictsort %}
    {{ item[0] }}
{% endfor %}
```

**Output**

```jinja
a b c d e f
```
### dump

Call [`JSON.stringify`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) on an object and dump the result into the
template. Useful for debugging: `{{ items | dump }}`.

**Input**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump }}
```

**Output**

```jinja

["a",1,{"b":true}]
```

Dump provides the spaces parameter to add spaces or tabs to the resulting
values. This makes the results more readable.

**Input**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump(2) }}
```

**Output**

```jinja
[
  "a",
  1,
  {
    "b": true
  }
]
```
**Input**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump('\t') }}
```

**Output**

```jinja
[
	"a",
	1,
	{
		"b": true
	}
]
```

### escape (aliased as e)

Convert the characters &, <, >, ‘, and ” in strings to HTML-safe sequences.
Use this if you need to display text that might contain such characters in HTML.
Marks return value as markup string

**Input**

```jinja
{{ "<html>" | escape }}
```

**Output**

```jinja
&lt;html&gt;
```

### first

Get the first item in an array or the first letter if it's a string:

**Input**

```jinja
{% set items = [1,2,3] %}
{{ items | first }}

{% set word = 'abc' %}
{{ word | first }}
```

**Output**

```jinja
1

a
```

### float

Convert a value into a floating point number. If the conversion fails 0.0 is returned.
This default can be overridden by using the first parameter.

**Input**

```jinja
{{ "3.5" | float }}
```

**Output**

```jinja
3.5
```

### forceescape

Enforce HTML escaping. This will probably double escape variables.

### groupby

Group a sequence of objects by a common attribute:

**Input**

```jinja
{% set items = [
        { name: 'james', type: 'green' },
        { name: 'john', type: 'blue' },
        { name: 'jim', type: 'blue' },
        { name: 'jessie', type: 'green' }
    ]
%}

{% for type, items in items | groupby("type") %}
    <b>{{ type }}</b> :
    {% for item in items %}
        {{ item.name }}
    {% endfor %}<br>
{% endfor %}
```

**Output**

```jinja
green : james jessie
blue : john jim
```

Attribute can use dot notation to use nested attribute, like `date.year`.

**Input**

```jinja
{% set posts = [
      {
        date: {
          year: 2019
        },
        title: 'Post 1'
      },
      {
        date: {
          year: 2018
        },
        title: 'Post 2'
      },
      {
        date: {
          year: 2019
        },
        title: 'Post 3'
      }
    ]
%}

{% for year, posts in posts | groupby("date.year") %}
    :{{ year }}:
    {% for post in posts %}
        {{ post.title }}
    {% endfor %}
{% endfor %}
```

**Output**

```jinja
:2018:
Post 2
:2019:
Post 1
Post 3
```

### indent

Indent a string using spaces.
Default behaviour is *not* to indent the first line.
Default indentation is 4 spaces.

**Input**

```jinja
{{ "one\ntwo\nthree" | indent }}
```

**Output**

```jinja
one
    two
    three
```

Change default indentation to 6 spaces:

**Input**

```jinja
{{ "one\ntwo\nthree" | indent(6) }}
```

**Output**

```jinja
one
      two
      three
```

Change default indentation to 6 spaces and indent the first line:

**Input**

```jinja
{{ "one\ntwo\nthree" | indent(6, true) }}
```

**Output**

```jinja
      one
      two
      three
```

### int

Convert the value into an integer.
If the conversion fails 0 is returned. You can override this default using the
first parameter. You can also override the default base (10) in the second
parameter.

**Input**

```jinja
{{ "3.5" | int }}
```

**Output**

```jinja
3
```

### join

Return a string which is the concatenation of the strings in a sequence:

**Input**

```jinja
{% set items =  [1, 2, 3] %}
{{ items | join }}
```

**Output**

```jinja
123
```

The separator between elements is an empty string by default which can
be defined with an optional parameter:

**Input**

```jinja
{% set items = ['foo', 'bar', 'bear'] %}
{{ items | join(",") }}
```

**Output**

```jinja
foo,bar,bear
```

This  behaviour is applicable to arrays:

**Input**

```jinja
{% set items = [
    { name: 'foo' },
    { name: 'bar' },
    { name: 'bear' }]
%}

{{ items | join(",", "name") }}
```

**Output**

```jinja
foo,bar,bear
```

### last

Get the last item in an array or the last letter if it's a string:

**Input**

```jinja
{% set items = [1,2,3] %}
{{ items | last }}

{% set word = 'abc' %}
{{ word | last }}
```

**Output**

```jinja
3

c
```

### length

Return the length of an array or string, or the number of keys in an object:

**Input**

```jinja
{{ [1,2,3] | length }}
{{ "test" | length }}
{{ {key: value} | length }}
```

**Output**

```jinja
3
4
1
```


### list

Convert the value into a list.
If it was a string the returned list will be a list of characters.

**Input**

```jinja
{% for i in "foobar" | list %}{{ i }},{% endfor %}
```

**Output**

```jinja
f,o,o,b,a,r,
```

### lower

Convert string to all lower case:

**Input**

```jinja
{{ "fOObAr" | lower }}
```

**Output**

```jinja
foobar
```

### nl2br

Replace new lines with `<br />` HTML elements:

**Input**

```jinja
{{ "foo\nbar" | striptags(true) | escape | nl2br }}
```

**Output**

```jinja
foo<br />\nbar
```

### random

Select a random value from an array.
(This will change everytime the page is refreshed).

**Input**

```jinja
{{ [1,2,3,4,5,6,7,8,9] | random }}
```

**Output**

A random value between 1-9 (inclusive).

### reject

Filters a sequence of objects by applying a test to each object, and rejecting
the objects with the test succeeding.

If no test is specified, each object will be evaluated as a boolean.

**Input**

```jinja
{% set numbers=[0, 1, 2, 3, 4, 5] %}

{{ numbers | reject("odd") | join }}
{{ numbers | reject("even") | join }}
{{ numbers | reject("divisibleby", 3) | join }}
{{ numbers | reject() | join }}
```

**Output**

```jinja
024
135
1245
0
```

### rejectattr (only the single-argument form)

Filter a sequence of objects by applying a test to the specified attribute
of each object, and rejecting the objects with the test succeeding.

This is the opposite of ```selectattr``` filter.

If no test is specified, the attribute’s value will be evaluated as a boolean.

**Input**

```jinja
{% set foods = [{tasty: true}, {tasty: false}, {tasty: true}]%}
{{ foods | rejectattr("tasty") | length }}
```

**Output**

```jinja
1
```

### replace

Replace one item with another. The first item is the item to be
replaced, the second item is the replaced value.

**Input**

```jinja
{% set numbers = 123456 %}
{{ numbers | replace("4", ".") }}
```

**Output**

```jinja
123.56
```

Insert a replaced item before and after a value, by adding quote marks
and replacing them surrounding an item:

**Input**

```jinja
{% set letters = aaabbbccc%}
{{ letters | replace("", ".") }}
```

**Output**

```jinja
.a.a.a.b.b.b.c.c.c.

```

Every instance of an item up to a given number (item to be replaced,
item replacement, number to be replaced):

**Input**

```jinja
{% set letters = "aaabbbccc" %}
{{ letters | replace("a", "x", 2) }}
```
Note in this instance the required quote marks surrounding the list.

**Output**

```jinja
xxabbbccc
```

It is possible to search for patterns in a list to replace:

**Input**

```jinja
{% set letters = "aaabbbccc" %}
{{ letters | replace("ab", "x", 2) }}
```

**Output**

```jinja
aaxbbccc
```

### reverse

Reverse a string:

**Input**

```jinja
{{ "abcdef" | reverse }}
```

**Output**

```jinja
fedcba
```

Reverse an array:

**Input**

```jinja
{% for i in [1, 2, 3, 4] | reverse %}
    {{ i }}
{% endfor %}
```

**Output**

```jinja
4 3 2 1
```

### round

Round a number:

**Input**

```jinja
{{ 4.5 | round }}
```

**Output**

```jinja
5
```

Round to the nearest whole number (which rounds down):

**Input**

```jinja
{{ 4 | round(0, "floor") }}
```

**Output**

```jinja
4
```

Specify the number of  digits to round:

**Input**

```jinja
{{ 4.12346 | round(4) }}
```

**Output**

```jinja
4.1235
```

### safe

Mark the value as safe which means that in an environment with automatic
escaping enabled this variable will not be escaped.

**Input**

```jinja
{{ "foo http://www.example.com/ bar" | urlize | safe }}
```

**Output**

```jinja
foo <a href="http://www.example.com/">http://www.example.com/</a> bar
```

### select

Filters a sequence of objects by applying a test to each object, and only
selecting the objects with the test succeeding.

If no test is specified, each object will be evaluated as a boolean.

**Input**

```jinja
{% set numbers=[0, 1, 2, 3, 4, 5] %}

{{ numbers | select("odd") | join }}
{{ numbers | select("even") | join }}
{{ numbers | select("divisibleby", 3) | join }}
{{ numbers | select() | join }}
```

**Output**

```jinja
135
024
03
12345
```

### selectattr (only the single-argument form)

Filter a sequence of objects by applying a test to the specified attribute
of each object, and only selecting the objects with the test succeeding.

This is the opposite to ```rejectattr```.

If no test is specified, the attribute’s value will be evaluated as a boolean.

**Input**

```jinja
{% set foods = [{tasty: true}, {tasty: false}, {tasty: true}]%}
{{ foods | selectattr("tasty") | length }}
```

**Output**

```jinja
2
```

### slice

Slice an iterator and return a list of lists containing those items:

**Input**

```jinja
{% set arr = [1,2,3,4,5,6,7,8,9] %}

<div class="columwrapper">
  {%- for items in arr | slice(3) %}
    <ul class="column-{{ loop.index }}">
    {%- for item in items %}
      <li>{{ item }}</li>
    {%- endfor %}
    </ul>
  {%- endfor %}
</div>
```

**Output**

```jinja
<div class="columwrapper">
    <ul class="column-1">
      <li>1</li>
      <li>2</li>
      <li>3</li>
    </ul>
    <ul class="column-2">
      <li>4</li>
      <li>5</li>
      <li>6</li>
    </ul>
    <ul class="column-3">
      <li>7</li>
      <li>8</li>
      <li>9</li>
    </ul>
</div>
```

### split

Split a string by a given separator and return a list of resulting strings:

**Input**

```jinja
{% set str = "/foo/bar/baz/" %}

{% str.split('/') %}
```

**Output**

```jinja
,foo,bar,baz,
```

### sort(arr, reverse, caseSens, attr)

Sort `arr` with JavaScript's `arr.sort` function. If `reverse` is true, result
will be reversed. Sort is case-insensitive by default, but setting `caseSens`
to true makes it case-sensitive. If `attr` is passed, will compare `attr` from
each item.

### string

Convert an object to a string:

**Input**

```jinja
{% set item = 1234 %}
{% for i in item | string | list %}
    {{ i }},
{% endfor %}
```

**Output**

```jinja
1,2,3,4,
```

### striptags (value, [preserve_linebreaks])

Analog of jinja's
[striptags](http://jinja.pocoo.org/docs/templates/#striptags). If
`preserve_linebreaks` is false (default), strips SGML/XML tags and replaces
adjacent whitespace with one space.  If `preserve_linebreaks` is true,
normalizes whitespace, trying to preserve original linebreaks. Use second
behavior if you want to pipe `{{ text | striptags(true) | escape | nl2br }}`.
Use default one otherwise.

### sum

Output the sum of items in the array:

**Input**

```jinja
{% set items = [1,2,3] %}
{{ items | sum }}
```

**Output**

```jinja
6
```

### title

Make the first letter of the string uppercase:

**Input**

```jinja
{{ "foo bar baz" | title }}
```

**Output**

```jinja
Foo Bar Baz
```

### trim

Strip leading and trailing whitespace:

**Input**

```jinja
{{ "  foo " | trim }}
```

**Output**

```jinja
foo
```

### truncate

Return a truncated copy of the string. The length is specified with the first
parameter which defaults to 255. If the second parameter is true the filter
will cut the text at length. Otherwise it will discard the last word. If the
text was in fact truncated it will append an ellipsis sign ("...").
A different ellipsis sign than "(...)"  can be specified using the third parameter.

Truncate to 3 characters:

**Input**

```jinja
{{ "foo bar" | truncate(3) }}
```

**Output**

```jinja
foo(...)
```

Truncate to 6 characters and replace "..." with a  "?":

**Input**

```jinja
{{ "foo bar baz" | truncate(6, true, "?") }}
```

**Output**

```jinja
foo ba ?
```

### upper

Convert the string to upper case:

**Input**

```jinja
{{ "foo" | upper }}
```

**Output**

```jinja
FOO
```

### urlencode

Escape strings for use in URLs, using UTF-8 encoding.
Accepts both dictionaries and regular strings as well as pairwise iterables.

**Input**

```jinja
{{ "&" | urlencode }}
```

**Output**

```jinja
%26
```

### urlize

Convert URLs in plain text into clickable links:

**Input**

```jinja
{{ "foo http://www.example.com/ bar" | urlize | safe }}
```

**Output**

```jinja
foo <a href="http://www.example.com/">http://www.example.com/</a> bar
```

Truncate URL text by a given number:

**Input**

```jinja
{{ "http://mozilla.github.io/" | urlize(10, true) | safe }}
```

**Output**

```jinja
<a href="http://mozilla.github.io/">http://moz</a>
```


### wordcount

Count and output the number of words in a string:

**Input**

```
{% set foo = "Hello World"%}
{{ foo | wordcount }}
```

**Output**

```
2
```

Alternatively, it's easy to [read the JavaScript
code](https://github.com/mozilla/nunjucks/blob/master/nunjucks/src/filters.js)
that implements these filters.

{% endraw %}
