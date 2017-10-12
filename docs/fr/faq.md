---
layout: subpage
title: FAQ
pageid: faq
---
{% raw %}

# Questions posées fréquemment

## Puis-je utiliser nunjucks dans node et dans le navigateur/côté client ?

Oui. Nunjucks supporte tous les navigateurs modernes et les versions de Node.js
[même supportées par la fondation Node.js](https://github.com/nodejs/Release#release-schedule1).

## Puis-je utiliser les mêmes modèles entre nunjucks et Jinja2? Quelles sont les différences ?

Il y a suffisamment de différences pour que cela puisse prendre du temps.
Le premier problème est que nunjucks vous permet d'accéder aux constructions natifs de
JavaScript, tandis que [jinja2](http://jinja.pocoo.org/) vous permet d'accéder à celle de
Python. Cela signifie qu'il y a des pièges mineurs comme le booléen littéral
qui est `true` dans nunjucks mais `True` dans jinja2, et si vous appelez des
méthodes natives sur les tableaux, l'API sera différent.

Toutefois, si vous n'accédez pas aux fonctionnalités natives de language (comme `{{ str.trim() }}`)
et utilisez uniquement les filtres et les caractéristiques de templates
pures, il devrait être facile de faire des templates compatibles.

Nunjucks a un support expérimental pour l'installation d'API dans l'environnement
de templates pour aider la compatibilité Jinja. Voir
[installJinjaCompat](api.html#installjinjacompat).

En plus, il y a quelques fonctionnalités de jinja2 qui ne sont pas implémentées dans nunjucks:

* La variable spéciale `self`
* `for` ne supporte pas `if not` et `else`
* Le style conditionnelle de `if i is divisibleby(3)`
* Le nommage des blocs de fin : `{% endblock content %}`
* Le mode bac à sable (sandbox)
* Les commentaires de lignes : `# for item in seq`

Enfin, tous les filtres et les extensions de Python personnalisés devront être écrits en JavaScript.

{% endraw %}
