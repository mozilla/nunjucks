---
layout: subpage
title: FAQ
pageid: faq
---
{% raw %}

# 常见问题

## nunjucks 是否可同时在 node 端和浏览器端使用?

是.

## 是否可在 nunjucks 和 jinja2 使用同一个模板？两者有什么区别？

有一些区别。

首先，nunjucks 可以操作原生的 Javascript 而 [jinja2](http://jinja.pocoo.org/) 操作的是 python，比如在 nunjucks 中布尔值为 `true` 而 jinja2 为 `True`，在调用数组原生方法的时候也不同。

但是，如果你避免使用原生语言的特性（如 `{{ str.trim() }}`） 而完全使用模板的特性和过滤器，那么两者的模块可以兼容。

Nunjucks 支持与 Jinja 兼容，查看 [installJinjaCompat](api.html#installjinjacompat) 获取更多信息。

除此之外，nunjucks 还有一些未实现的功能：

* `self` 变量
* `for` 不支持 `if not` and `else`
* `if i is divisibleby(3)` 式的条件判断
* 可命名的结束区块： `{% endblock content %}`
* 沙箱模式 (Sandboxed mode)
* 行语句： `# for item in seq`

最后，自定义的 python 过滤器和扩展需要用 Javascript 重写。

{% endraw %}
