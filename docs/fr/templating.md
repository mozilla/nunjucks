---
layout: subpage
title: Templates
---
{% raw %}

# Templating

Ceci est un aperçu des caractéristiques des templates disponibles dans Nunjucks.

> Nunjucks est essentiellement un port de
> [jinja2](http://jinja.pocoo.org/docs/), donc vous pouvez lire leurs
> [docs](http://jinja.pocoo.org/docs/templates/) s'il manque quelque
> chose ici. Découvrez les différences
> [ici](faq.html#puis-je-utiliser-les-mmes-modles-entre-nunjucks-et-jinja2-quelles-sont-les-diffrences).

## Extensions de fichier

Bien que vous soyez libre d'utiliser n'importe quelle extension de fichier pour vos
fichiers de template Nunjucks, la communauté de Nunjucks a adopté `.njk`.

Si vous développez des outils ou des aides de syntaxe pour éditeur pour Nunjucks,
veuillez inclure la reconnaissance de l'extension `.njk`.

## Coloration syntaxique

Des plugins sont disponibles pour les différents éditeurs pour prendre en charge la coloration syntaxique de `jinja` de Nunjucks.

* atom <https://github.com/alohaas/language-nunjucks>
* vim <https://github.com/niftylettuce/vim-jinja>
* brackets <https://github.com/axelboc/nunjucks-brackets>
* sublime <https://github.com/mogga/sublime-nunjucks/blob/master/Nunjucks.tmLanguage>
* emacs <http://web-mode.org>

## Variables

Une variable remplace une valeur dans le contexte du template. Si vous souhaitez
simplement afficher une variable, vous devez faire :

```jinja
{{ username }}
```

Ceci recherche `username` depuis le contexte et l'affiche. Les noms des
variables peuvent posséder des points qui sont des propriétés, tout comme
javascript. Vous pouvez également utiliser la syntaxe des crochets.

```jinja
{{ foo.bar }}
{{ foo["bar"] }}
```

Ces deux syntaxes font exactement la même chose, tout comme javascript.

Si une valeur est `undefined` ou `null`, rien ne sera affiché. Le même comportement
se produit lors du référencement des objets `undefined` ou `null`. Tous les
cas suivants n'afficheront rien si `foo` est indéfini : `{{ foo }}`, `{{
foo.bar }}`, `{{ foo.bar.baz }}`.

## Filtres

Les filtres sont essentiellement des fonctions qui peuvent être appliquées aux variables.
Ils sont appelés avec le caractère "pipe" (`|`) et peuvent prendre des arguments.

```jinja
{{ foo | title }}
{{ foo | join(",") }}
{{ foo | replace("foo", "bar") | capitalize }}
```

Le troisième exemple montre comment vous pouvez enchaîner des filtres. Cela affichera
"Bar", en remplaçant d'abord "foo" par "bar" puis en mettant la première lettre en capital.

Nunjucks est livré avec plusieurs
[filtres intégrés](#filtres-intgrs) et vous pouvez aussi
[ajouter vos propres filtres](api.html#filtres-personnalis-s).

## L'héritage de template

L'héritage de template est moyen qui facilite la réutilisation des templates. Lors
de l'écriture d'un template, vous pouvez définir des "blocs" que des templates enfants
remplaceront. La chaîne d'héritage peut être aussi longue que vous le souhaitez.

Si nous avons un template `parent.html` qui ressemble à ceci :

```jinja
{% block header %}
C'est le contenu par défaut
{% endblock %}

<section class="left">
  {% block left %}{% endblock %}
</section>

<section class="right">
  {% block right %}
  C'est un autre contenu
  {% endblock %}
</section>
```

Et nous rendons ce template :

```jinja
{% extends "parent.html" %}

{% block left %}
C'est la partie gauche !
{% endblock %}

{% block right %}
C'est la partie droite !
{% endblock %}
```

Nous aurons en sortie :

```jinja
C'est le contenu par défaut

<section class="left">
  C'est la partie gauche !
</section>

<section class="right">
  C'est la partie droite !
</section>
```

Vous pouvez stocker le template à hériter dans une variable et l'utiliser en
omettant les guillemets. Cette variable peut contenir un string qui pointe vers
un fichier template ou peut contenir un objet Template compilé qui a été ajouté
au contexte. De cette façon, vous pouvez modifier dynamiquement le
template à hériter lors du rendu en le plaçant dans le contexte.

```jinja
{% extends parentTemplate %}
```

Vous exploitez l'héritage avec les tags [`extends`](#extends) et
[`block`](#block). Une explication plus détaillée de l'héritage
peut être trouvé dans les [docs de
jinja2](http://jinja.pocoo.org/docs/templates/#template-inheritance).

### super

Vous pouvez rendre les contenus du bloc parent à l'intérieur d'un bloc enfant
en appelant `super`. Si dans le modèle de l'enfant ci-dessus, vous avez :

```jinja
{% block right %}
{{ super() }}
Partie droite !
{% endblock %}
```

La sortie du bloc sera :

```
C'est un autre contenu
Partie droite !
```

## Tags

Les tags sont des blocs spéciaux qui effectuent des opérations sur des sections du template.
Nunjucks est livré avec plusieurs tags intégrés, mais [vous pouvez ajouter vos propres tags](api.html#tags-personnaliss).

### if

`if` teste une condition et vous permet d'afficher de manière sélective le contenu. Il se comporte
exactement comme le `if` de javascript.

```jinja
{% if variable %}
  C'est vrai
{% endif %}
```

Si `variable` est défini et évalué à `true`, "C'est vrai"
s'affichera, sinon rien n'apparaitra.

Vous pouvez spécifier des conditions alternatives avec `elif` (ou `elseif`, qui est simplement un alias de `elif`)
et `else` :

```jinja
{% if faim %}
  J'ai faim
{% elif fatigue %}
  Je suis fatigué
{% else %}
  Je suis bien !
{% endif %}
```

Vous pouvez également utiliser `if` comme une [expression en ligne](#expression-if).

### for

`for` permet d'itérer sur les tableaux et les dictionnaires.

> Si vous utilisez un chargeur de template personnalisé qui est asynchrone, regardez
> [`asyncEach`](#asynceach))

```js
var items = [{ title: "foo", id: 1 }, { title: "bar", id: 2}];
```

```jinja
<h1>Articles</h1>
<ul>
{% for item in items %}
  <li>{{ item.title }}</li>
{% else %}
  <li>Cela devrait s'afficher si la collection 'item' est vide</li>
{% endfor %}
</ul>
```

L'exemple ci-dessus liste tous les articles en utilisant l'attribut `title` qui est affiché pour chaque élément
dans le tableau `items`. Si le tableau `items` est vide, le contenu
de la clause facultatif `else` sera rendu.

Vous pouvez aussi itérez sur des objets/tables de hachage :

```js
var food = {
  'ketchup': '5 doses',
  'moutarde': '1 doses',
  'cornichon': '0 dose'
};
```

```jinja
{% for ingredient, amount in food %}
  Utilisez {{ amount }} de {{ ingredient }}
{% endfor %}
```

Le filtre [`dictsort`](http://jinja.pocoo.org/docs/templates/#dictsort) est disponible
pour trier les objets lors de leur itération.

De plus, Nunjucks découpera les tableaux dans des variables :

```js
var points = [[0, 1, 2], [5, 6, 7], [12, 13, 14]];
```

```jinja
{% for x, y, z in points %}
  Point: {{ x }}, {{ y }}, {{ z }}
{% endfor %}
```

A l'intérieur des boucles, vous avez accès à quelques variables particulières :

* `loop.index` : l'itération actuel de la boucle (l'index commence à 1)
* `loop.index0` : l'itération actuel de la boucle (l'index commence à 0)
* `loop.revindex` : le nombre d'itérations jusqu'à la fin (l'index commence à 1)
* `loop.revindex0` : le nombre d'itérations jusqu'à la fin (l'index commence à 0)
* `loop.first` : le booléen qui indique si c'est la première itération
* `loop.last` : le booléen qui indique si c'est la dernière itération
* `loop.length` : le nombre total d'éléments

### asyncEach

> Ceci ne s'applique qu'aux templates asynchrones. Découvrez-les
> [ici](api.html#support-asynchrone)

`asyncEach` est une version asynchrone de `for`. Nécessaire seulement si
vous utilisez un [chargeur de template qui est
asynchrone](api.html#asynchrone), autrement, vous n'en aurez jamais besoin. Les filtres
et les extensions Async en ont aussi besoin, mais les boucles internes sont
automatiquement converties en `asyncEach` si des filtres et
des extensions Async sont utilisés dans la boucle.

`asyncEach` a exactement le même comportement que `for`, mais il permet de gérer
la boucle de façon asynchrone. La raison pour laquelle ces balises sont distinctes :
c'est la performance. La plupart des gens utilisent des templates de façon synchrone et c'est beaucoup
plus rapide avec `for` que de le compiler avec une boucle normale `for` en JavaScript.

Au moment de la compilation, Nunjucks ne sait pas comment les templates sont chargés,
donc il n'est pas en mesure de déterminer si un bloc `include` est asynchrone ou non.
C'est pourquoi il ne peut pas convertir automatiquement les boucles pour vous et donc vous
devez utiliser `asyncEach` pour itérer si vous chargez des templates de façon asynchrone
à l'intérieur de la boucle.

```js
// Si vous utilisez un chargeur personnalisé qui est asynchrone, vous avez besoin de asyncEach
var env = new nunjucks.Environment(AsyncLoaderFromDatabase, opts);
```
```jinja
<h1>Articles</h1>
<ul>
{% asyncEach item in items %}
  {% include "item-template.html" %}
{% endeach %}
</ul>
```

### asyncAll

> Ceci ne s'applique qu'aux templates asynchrones. Découvrez-les
> [ici](api.html#support-asynchrone)

`asyncAll` est similaire à `asyncEach`, sauf qu'il rend tous les éléments
en parallèle, tout en préservant l'ordre des éléments. Ceci est seulement utile
si vous utilisez des filtres, des extensions ou des chargeurs asynchrones.
Sinon, vous ne devez jamais utiliser cela.

Disons que vous avez créé un filtre nommé `lookup` qui récupère un peu de texte
à partir d'une base de données. Vous pouvez donc rendre plusieurs éléments
en parallèle avec `asyncAll` :

```jinja
<h1>Articles</h1>
<ul>
{% asyncAll item in items %}
  <li>{{ item.id | lookup }}</li>
{% endall %}
</ul>
```

Si `lookup` est un filtre asynchrone, il est probablement en train de faire
quelque chose de lent, par exemple aller chercher quelque chose à partir du
disque. `asyncAll` vous permet de réduire le temps qu'il faudrait pour exécuter
la boucle séquentiellement en faisant tout le travail de façon asynchrone en parallèle.
Le rendu du template reprend une fois que tous les éléments sont traités.

### macro

`macro` vous permet de définir des morceaux de contenu réutilisables. C'est semblable à
une fonction dans un langage de programmation. Voici un exemple :

```jinja
{% macro field(name, value='', type='text') %}
<div class="field">
  <input type="{{ type }}" name="{{ name }}"
         value="{{ value | escape }}" />
</div>
{% endmacro %}
```
Maintenant `field` est disponible, il peut être appelé comme une fonction normale :

```jinja
{{ field('user') }}
{{ field('pass', type='password') }}
```

Les arguments par défaut et avec mots clefs sont disponibles. Regardez
[arguments avec mots clefs](#arguments-avec-mots-clefs) pour une explication plus détaillée.

Vous pouvez importer ([import](#import)) des macros à partir d'autres templates, cela vous permet
de les réutiliser librement à travers votre projet.

**Remarque importante** : Si vous utilisez l'API asynchrone, soyez conscient que
vous ne pouvez rien faire d'asynchrone à l'intérieur des macros. Car les macros
sont appelées comme des fonctions normales. Dans le futur, nous pourrions avoir un moyen d'appeler
une fonction de manière asynchrone. Si vous faites cela maintenant, le comportement est inconnu.

### set

`set` vous permet de créer/modifier une variable.

```jinja
{{ username }}
{% set username = "joe" %}
{{ username }}
```

Si `username` avait initialement la valeur "james", cela affichera "james joe".

Vous pouvez inclure des nouvelles variables et en définir aussi plusieurs à la fois :

```jinja
{% set x, y, z = 5 %}
```

Si `set` est utilisé au plus haut niveau, il modifie la valeur du contexte du template
global. Si il est utilisé à l'intérieur de la portée des blocs, comme `for`, `include` et d'autres, cela modifie
seulement dans cette portée.

Il est également possible de capter le contenu d'un bloc dans une variable en utilisant
l'affectation de bloc. La syntaxe est similaire au standard `set`, sauf que le
`=` est omis, et tout ce qui se trouve jusqu'au `{% endset %}` est capturé.

Cela peut être utile dans certains cas, comme une alternative aux macros :

```jinja
{% set standardModal %}
    {% include 'standardModalData.html' %}
{% endset %}

<div class="js-modal" data-modal="{{standardModal | e}}">
```

### extends

`extends` est utilisé pour définir l'héritage de template. Le template
spécifié est utilisé comme template de base. Regardez [l'héritage
de template](#l39hritage-de-template).

```jinja
{% extends "base.html" %}
```

Vous pouvez stocker le template à hériter dans une variable et l'utiliser en
omettant les guillemets. Cette variable peut contenir un string qui pointe vers
un fichier template ou peut contenir un objet Template compilé qui a été ajouté
au contexte. De cette façon, vous pouvez modifier dynamiquement le
template à hériter lors du rendu en le plaçant dans le contexte.

```jinja
{% extends parentTemplate %}
```

En fait, `extends` accepte n'importe quelle expression arbitraire, donc vous
pouvez y passer n'importe quoi, aussi longtemps que cette expression correspond
à un string ou un objet Template compilé :

```jinja
{% extends name + ".html" %}`.
```

### block

`block` définit une section dans le template et l'identifie par un
nom. C'est utilisé par l'héritage de template. Les templates de base peuvent définir
des blocs, ainsi des templates enfants peuvent les remplacer avec du nouveau contenu. Regardez
[l'héritage de template](#l39hritage-de-template).

```jinja
{% block css %}
<link rel="stylesheet" href="app.css" />
{% endblock %}
```

Vous pouvez même définir des blocs dans une boucle :

```jinja
{% for item in items %}
{% block item %}{{ item }}{% endblock %}
{% endfor %}
```

Les templates enfants peuvent remplacer le bloc `item` et changer la façon dont il est affiché :

```jinja
{% extends "item.html" %}

{% block item %}
Le nom de l'élément est : {{ item.name }}
{% endblock %}
```

Une fonction spéciale `super` est disponible à l'intérieur des blocs qui
rendra le contenu du bloc parent. Regardez [super](#super).

### include

`include` récupère depuis d'autres templates disponibles. C'est utile lorsque vous avez besoin de partager des
petits morceaux sur plusieurs templates qui héritent déjà d'autres templates.

```jinja
{% include "item.html" %}
```

Vous pouvez même inclure des templates à l'intérieur des boucles :

```jinja
{% for item in items %}
{% include "item.html" %}
{% endfor %}
```

Ceci est particulièrement utile pour découper des templates en petits morceaux afin que l'environnement du
côté du navigateur puisse rendre les petits morceaux quand il est nécessaire de changer
de page.

`include` accepte n'importe quelle expression arbitraire, donc vous pouvez y passer n'importe quoi,
aussi longtemps que cette expression correspond à un string ou un objet Template
compilé : `{% include name + ".html" %}`.

Dans certains cas, il peut être utile de ne pas générer une erreur quand un template n'existe pas. Utilisez
l'option `ignore missing` pour supprimer ces erreurs.

```jinja
{% include "missing.html" ignore missing %}
```

Un template inclus peut lui même étendre (`extend`) un autre template (donc vous pourriez avoir
un ensemble de template qui hérite tous d'une structure commune). Un template
inclus ne participe pas à la structure du bloc du template l'incluant;
il dispoose d'un arbre d'héritage et d'un espace nommé totalement distinct. En d'autres termes,
un `include` _n'_ est _pas_ un pré-processeur qui tire le code du template inclus
dans le template, en l'incluant avant de le rendre; au lieu de cela, il déclenche un rendu distinct
du template inclus, et les résultats de ce rendu sont inclus.

### import

`import` charge un template différent et vous permet d'accéder à ses valeurs
exportées. Les macros et les affectations de haut niveau (faites avec [`set`](#set)) sont exportées
depuis les templates, ceci vous permet donc d'y accéder dans un template différent.

Les templates importés sont traités sans le contexte actuel, ils n'ont pas
accès à toutes les variables du template actuel.

Commençons par un template appelé `forms.html` qui contient ce qui suit :

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

Nous pouvons importer ce template et lier toutes ses valeurs exportées à une variable
afin que nous puissions l'utiliser :

```jinja
{% import "forms.html" as forms %}

{{ forms.label('Username') }}
{{ forms.field('user') }}
{{ forms.label('Password') }}
{{ forms.field('pass', type='password') }}
```

Vous pouvez aussi importer des valeurs depuis un template dans l'espace de nommage
actuel avec `from import` :

```jinja
{% from "forms.html" import field, label as description %}

{{ description('Username') }}
{{ field('user') }}
{{ description('Password') }}
{{ field('pass', type='password') }}
```

`import` accepte n'importe quelle expression arbitraire, donc vous pouvez y passer
n'importe quoi, aussi longtemps que cette expression correspond à un string ou un objet
Template compilé : `{% import name + ".html" as obj %}`.

### raw

Si vous voulez afficher des balises spéciales de Nunjucks comme `{{`, vous pouvez utiliser
un bloc `{% raw %}` et tout ce qui sera à l'intérieur de celui-ci sera affiché au format texte brut.

### verbatim

`{% verbatim %}` a le même comportement que [`{% raw %}`](#raw). Il a été ajouté pour
être compatible avec la [balise `verbatim` de Twig](http://twig.sensiolabs.org/doc/tags/verbatim.html).

### filter

Un bloc `filter` vous permet d'appeler un filtre avec le contenu de ce
bloc. Au lieu de passer une valeur avec la syntaxe `|`, le contenu
du bloc sera passé.

```jinja
{% filter title %}
que la force soit avec toi
{% endfilter %}

{% filter replace("force", "forth") %}
que la force soit avec toi
{% endfilter %}
```

REMARQUE : Vous ne pouvez pas faire quelque chose d'asynchrone à l'intérieur de ces blocs.

### call

Un bloc `call` vous permet d'appeler une macro avec tout le texte à l'intérieur de
la balise. Ceci est utile si vous voulez passer beaucoup de contenu dans une macro. Le
contenu est disponible à l'intérieur de la macro telle que `caller()`.

```jinja
{% macro add(x, y) %}
{{ caller() }} : {{ x + y }}
{% endmacro%}

{% call add(1, 2) -%}
Le résultat est
{%- endcall %}
```

L'exemple ci-dessus affichera "Le résultat est : 3".

## Arguments avec mots clefs

jinja2 utilise le support des arguments avec mots clefs de Python pour permettre de les utiliser dans
les fonctions, les filtres et les macros. Nunjucks supporte bien les arguments avec mots clefs en
introduisant une nouvelle convention d'appel.

Les arguments avec mots clefs ressemblent à ceci :

```jinja
{{ foo(1, 2, bar=3, baz=4) }}
```

`bar` et `baz` sont les arguments avec mots clefs. Nunjucks les convertit dans un hash et le
passe comme dernier argument. C'est équivalent à cet appel en javascript :

```js
foo(1, 2, { bar: 3, baz: 4})
```

Puisqu'il s'agit d'une convention d'appel standard, ça marche pour toutes les fonctions et les
filtres, s'ils sont écrits pour les gérer. [Lisez-en plus](api.html#arguments-avec-mots-clefspar-dfaut)
dans la section de l'API.

Les macros vous permettent d'utiliser également des arguments avec mots clefs dans la définition, cela vous permet
de définir des valeurs par défaut. Nunjucks fait correspondre automatiquement les
arguments avec mots clefs à ceux définis dans la macro.

```
{% macro foo(x, y, z=5, w=6) %}
{{ x }}, {{ y }}, {{ z }}, {{ w}}
{% endmacro %}

{{ foo(1, 2) }}        -> 1, 2, 5, 6
{{ foo(1, 2, w=10) }}  -> 1, 2, 5, 10
```

Vous pouvez mélanger des arguments de position et des arguments avec mots clefs dans des macros. Par exemple, vous pouvez
spécifier un argument de position comme un argument mot clef :

```jinja
{{ foo(20, y=21) }}     -> 20, 21, 5, 6
```

Vous pouvez donc simplement passer un argument de position à la place d'un argument mot clef :

```jinja
{{ foo(5, 6, 7, 8) }}   -> 5, 6, 7, 8
```

De cette façon, vous pouvez «sauter» les arguments de position :

```jinja
{{ foo(8, z=7) }}      -> 8, , 7, 6
```

## Commentaires

Vous pouvez écrire des commentaires en utilisant `{#` et `#}`. Les commentaires sont complètement retirés
lors du rendu.

```jinja
{# Boucle pour tous les users #}
{% for user in users %}...{% endfor %}
```

## Contrôle des espaces

Normalement, le moteur de template affiche tout, à l'exception des blocks verbeux de tag et
de variable, avec tous les espaces qui se trouvent dans le fichier. Parfois, vous ne
voulez pas les espaces supplémentaires, mais vous voulez continuer à formater le template
proprement, ce qui nécessite des espaces.

Vous pouvez dire au moteur d'enlever les espaces de début et de fin en ajoutant le signe
moins (`-`) sur le tag de début ou de fin d'un bloc ou d'une variable.

```jinja
{% for i in [1,2,3,4,5] -%}
  {{ i }}
{%- endfor %}
```

L'affichage exact de l'exemple du dessus sera "12345". Le `{%-` enlève les espaces à
droite avant le tag et le `-%}` enlève les espaces à droite après le tag.

C'est la même chose pour les variables: `{{-` enlève les espaces avant la variable,
et `-}}` enlève les espaces après la variable.

## Expressions

Vous pouvez utiliser plusieurs types d'expressions littérales que vous avez l'habitude d'utiliser en javascript.

* Strings: `"Comment ça va ?"`, `'Comment ça va ?'`
* Numbers: `40`, `30.123`
* Arrays: `[1, 2, "tableau"]`
* Dicts: `{ un: 1, deux: 2 }`
* Boolean: `true`, `false`

### Math

Nunjucks vous permet de faire des opérations sur des valeurs (bien que cela doit être utilisée avec parcimonie,
car la plupart de votre logique doit être dans le code). Les opérateurs suivants sont
disponibles :

* Addition : `+`
* Soustraction : `-`
* Division : `/`
* Division arrondi à l'entier : `//`
* Reste de division : `%`
* Multiplication : `*`
* Puissance : `**`

Vous pouvez les utiliser ainsi :

```jinja
{{ 2 + 3 }}       (affichage 5)
{{ 10/5 }}        (affichage 2)
{{ numItems*2 }}
```

### Comparaisons

* `==`
* `===`
* `!=`
* `!==`
* `>`
* `>=`
* `<`
* `<=`

Exemples :

```jinja
{% if numUsers < 5 %}...{% endif %}
{% if i == 0 %}...{% endif %}
```

### Logique

* `and`
* `or`
* `not`
* Utilisez les parenthèses pour grouper les expressions

Exemples :

```jinja
{% if users and showUsers %}...{% endif %}
{% if i == 0 and not hideFirst %}...{% endif %}
{% if (x < 5 or y < 5) and foo %}...{% endif %}
```

### Expression If

Similaire aux opérateurs ternaires de javascript, vous pouvez utiliser `if` comme si c'était une
expression en ligne :

```jinja
{{ "true" if foo else "false" }}
```

L'affichage du dessus sera "true" si foo est vrai sinon "false". Ceci
est particulièrement utile pour les valeurs par défaut comme celle-ci :

```jinja
{{ baz(foo if foo else "default") }}
```

Contrairement à l'opérateur ternaire de javascript, le `else` est facultatif :

```jinja
{{ "true" if foo }}
```

### Appels de fonction

Si vous avez passé une méthode javascript à votre template, vous pouvez l'appeler
normalement.

```jinja
{{ foo(1, 2, 3) }}
```

### Expressions régulières

Une expression régulière peut être créée comme en JavaScript, mais elle a besoin d'être précédée par `r` :

```jinja
{% set regExp = r/^foo.*/g %}
{% if regExp.test('foo') %}
  Foo dans la maison !
{% endif %}
```

Les flags supportés sont les suivants. Voir
[Regex sur MDN](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp)
pour plus d'informations.

* `g` : La correspondance est cherchée partout
* `i` : La casse est ignorée
* `m` : Multi-ligne
* `y` : Adhésion

## Auto-échappement

Si autoescaping est activé dans l'environnement, tout l'affichage sera automatiquement
échappé pour un affichage safe. Pour marquer manuellement un affichage à safe, utilisez le
filtre `safe`. Nunjucks n'échappera pas cet affichage.

```jinja
{{ foo }}           // &lt;span%gt;
{{ foo | safe }}    // <span>
```

Si autoescaping n'est pas activé, tout l'affichage sera rendu tel quel. Vous pouvez
manuellement échapper les variables avec le filtre `escape`.

```jinja
{{ foo }}           // <span>
{{ foo | escape }}  // &lt;span&gt;
```

## Fonctions globales

Il y a quelques fonctions globales intégrées qui couvrent certains cas courants.

### range([start], stop, [step])

Si vous avez besoin d'itérer sur un ensemble de numéros fixes, `range` génère cet ensemble
pour vous. Les numéros commencent à `start` (0 par défaut) et s'incrémente de `step` (par défaut 1)
jusqu'à ce qu'il atteigne `stop`, qui n'est pas inclus.

```jinja
{% for i in range(0, 5) -%}
  {{ i }},
{%- endfor %}
```

L'affichage ci-dessus est `0,1,2,3,4`.

### cycler(item1, item2, ...itemN)

Une façon simple de faire un cycle avec plusieurs valeurs est d'utiliser `cycler`, qui prend
un certain nombre d'arguments et fait des cycles à travers eux.

```jinja
{% set cls = cycler("odd", "even") %}
{% for row in rows %}
  <div class="{{ cls.next() }}">{{ row.name }}</div>
{% endfor %}
```

Dans l'exemple ci-dessus, les lignes impaires ont la classe "odd" et les lignes paires ont la
classe "even". Vous pouvez accéder à l'élément en cours avec la propriété `current` (dans
l'exemple du dessus : `cls.current`).

### joiner([separator])

En combinant plusieurs éléments, il est fréquent de vouloir les délimiter par
quelque chose comme une virgule, mais vous ne voulez pas afficher le séparateur pour le
premier élément. La classe `joiner` affichera le `separator` (par défaut ",") chaque fois qu'elle
sera appelée sauf pour la première fois.

```jinja
{% set comma = joiner() %}
{% for tag in tags -%}
  {{ comma() }} {{ tag }}
{%- endfor %}
```

Si `tags` avait `["food", "beer", "dessert"]`, l'exemple ci-dessus afficherait `food, beer, dessert`.

## Filtres intégrés

Nunjucks a porté la plupart des [filtres de jinja](http://jinja.pocoo.org/docs/dev/templates/#builtin-filters), et il a ses propres filtres :

### abs

Retourne la valeur absolue de l'argument :

**Entrée**

```jinja
{{ -3|abs }}
```

**Sortie**

```jinja
3
```

### batch

Retourne une liste de listes avec le numéro des éléments :

**Entrée**

```jinja
{% set items = [1,2,3,4,5,6] %}
{% for item in items | batch(2) %}
    -{% for items in item %}
       {{ items }}
    {% endfor %}
{% endfor %}
```

**Sortie**

```jinja
12-34-56
```

### capitalize

Met la première lettre en majuscule et le reste en minuscule :

**Entrée**

```jinja
{{ "Ceci Est Un Test" | capitalize }}
```

**Sortie**

```jinja
Ceci est un test
```


### center

Centre la valeur dans un champ d'une largeur donnée :

**Entrée**

```jinja
{{ "fooo" | center }}
```

**Sortie**

```jinja
fooo
```

### default(value, default, [boolean])

(raccourci avec `d`)

Si `value` est strictement `undefined`, cela retourne `default`, sinon `value`. Si
`boolean` est true, toute valeur JavaScript fausse retournera `default` (false, "",
etc)

**La version 2.0 a changé le comportement par défaut de ce filtre.
  Auparavant, il agissait comme si `boolean` était à true par défaut et donc toute
  valeur fausse retournait `default`. Dans la 2.0, le comportement par défaut retourne
  `default` seulement pour une valeur `undefined`. Vous pouvez obtenir l'ancien
  comportement en passant `true` à `boolean`, ou en utilisant simplement `value or default`.**

### dictsort

Tri un dictionnaire et rend des paires (clé, valeur) :

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

**Sortie**

```jinja
a b c d e f
```
### dump

Appelle [`JSON.stringify`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) sur un objet et déverse le résultat dans le
template. C'est utile pour le débogage : `{{ foo | dump }}`.

**Entrée**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump }}
```

**Sortie**

```jinja

["a",1,{"b":true}]
```

Dump fournit un paramètre pour les espaces afin d'ajouter des espaces ou des tabulations aux valeurs
retournées. Cela rend le résultat plus lisible.

**Entrée**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump(2) }}
```

**Sortie**

```jinja
[
  "a",
  1,
  {
    "b": true
  }
]
```
**Entrée**

```jinja
{% set items = ["a", 1, { b : true}] %}
{{ items | dump('\t') }}
```

**Sortie**

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

Convertit les caractères &, <, >, â€˜, et â€ dans des chaines avec des séquences HTML sécurisées.
Utilisez cette option si vous avez besoin d'afficher du texte qui pourraient contenir des caractères en HTML.
Les résultats rendent la valeur comme une chaîne de balisage.

**Entrée**

```jinja
{{ "<html>" | escape }}
```

**Sortie**

```jinja
&lt;html&gt;
```

### first

Donne le premier élément dans un tableau :

**Entrée**

```jinja
{% set items = [1,2,3] %}
{{ items | first }}
```

**Sortie**

```jinja
1
```

### float

Convertit une valeur en un nombre à virgule flottant. Si la conversion échoue, 0.0 est retourné.
Cette valeur par défaut peut être modifiée en utilisant le premier paramètre.

**Entrée**

```jinja
{{ "3.5" | float }}
```

**Sortie**

```jinja
3.5
```

### groupby

Groupe une séquence d'objets par un attribut commun :

**Entrée**

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

**Sortie**

```jinja
green : james jessie
blue : john jim
```

### indent

Indente une chaîne en utilisant des espaces.
Le comportement par défaut est de ne pas indenter la première ligne.
Par défaut l'indentation est de 4 espaces.

**Entrée**

```jinja
{{ "one\ntwo\nthree" | indent }}
```

**Sortie**

```jinja
one
    two
    three
```

Change l'indentation par défaut à 6 espaces :

**Entrée**

```jinja
{{ "one\ntwo\nthree" | indent(6) }}
```

**Sortie**

```jinja
one
      two
      three
```

Change l'indentation par défaut à 6 espaces et indente la première ligne :

**Entrée**

```jinja
{{ "one\ntwo\nthree" | indent(6, true) }}
```

**Sortie**

```jinja
      one
      two
      three
```

### int

Convertit la valeur en un entier.
Si la conversion échoue, cela retourne 0.

**Entrée**

```jinja
{{ "3.5" | int }}
```

**Sortie**

```jinja
3
```

### join

Retourne une chaine qui est la concaténation des chaines dans la séquence :

**Entrée**

```jinja
{% set items =  [1, 2, 3] %}
{{ items | join }}
```

**Sortie**

```jinja
123
```

Le séparateur entre les éléments est par défaut une chaine vide qui peut
être définie avec un paramètre facultatif :

**Entrée**

```jinja
{% set items = ['foo', 'bar', 'bear'] %}
{{ items | join(",") }}
```

**Sortie**

```jinja
foo,bar,bear
```

Ce comportement est applicable aux tableaux :

**Entrée**

```jinja
{% set items = [
    { name: 'foo' },
    { name: 'bar' },
    { name: 'bear' }]
%}

{{ items | join(",", "name") }}
```

**Sortie**

```jinja
foo,bar,bear
```

### last

Donne le dernier élément dans un tableau :

**Entrée**

```jinja
{% set items = [1,2,3] %}
{{ items | last }}
```

**Sortie**

```jinja
3
```

### length

Retourne la longueur d'un tableau, d'une chaine ou le nombre de clés dans un objet :

**Entrée**

```jinja
{{ [1,2,3] | length }}
{{ "test" | length }}
{{ {key: value} | length }}
```

**Sortie**

```jinja
3
4
1
```


### list

Convertit la valeur en une liste.
Si c'est une chaine, la liste retournée sera une liste de caractères.

**Entrée**

```jinja
{% for i in "foobar" | list %}{{ i }},{% endfor %}
```

**Sortie**

```jinja
f,o,o,b,a,r,
```

### lower

Convertit une chaine en minuscule :

**Entrée**

```jinja
{{ "fOObAr" | lower }}
```

**Sortie**

```jinja
foobar
```

### nl2br

Remplace les nouvelles lignes par des éléments HTML `<br />` :

**Entrée**

```jinja
{{ "foo\nbar" | striptags(true) | escape | nl2br }}
```

**Sortie**

```jinja
foo<br />\nbar
```

### random

Sélectionne une valeur aléatoire depuis un tableau.
(Cela changera à chaque fois que la page est actualisée).

**Entrée**

```jinja
{{ [1,2,3,4,5,6,7,8,9] | random }}
```

**Sortie**

Une valeur aléatoire entre 1-9 (dont les bornes sont incluses).


### rejectattr (uniquement pour le cas d'un unique argument)

Filtre une suite d'objets, en appliquant un test sur l'attribut spécifié
pour chaque objet et en rejetant les objets où le test réussit.

Ceci est à l'opposé du filtre ```selectattr```.

Si aucun test n'est spécifié, la valeur de l'attribut sera évaluée comme une valeur booléenne.

**Entrée**

```jinja
{% set foods = [{tasty: true}, {tasty: false}, {tasty: true}]%}
{{ foods | rejectattr("tasty") | length }}
```

**Sortie**

```jinja
1
```

### replace

Remplace un élément par un autre. Le premier argument est l'élément à
remplacer, le deuxième est la valeur de remplacement.

**Entrée**

```jinja
{% set numbers = 123456 %}
{{ numbers | replace("4", ".") }}
```

**Sortie**

```jinja
123.56
```

Pour insérer un élément avant et après une valeur, il faut ajouter des guillemets et
cela mettra l'élément autour de la valeur :

**Entrée**

```jinja
{% set lettres = aaabbbccc%}
{{ "lettres" | replace("", ".") }}
```

**Sortie**

```jinja
.l.e.t.t.r.e.s.

```

Il possible de préciser le nombre de remplacement à effectuer (élément à remplacer,
élément de remplacement, nombre de remplacement) :

**Entrée**

```jinja
{% set letters = "aaabbbccc" %}
{{ letters | replace("a", "x", 2) }}
```
Remarquez que dans ce cas, les guillemets sont nécessaires pour la liste.

**Sortie**

```jinja
xxabbbccc
```

Il est possible de rechercher des modèles dans une liste pour les remplacer :

**Entrée**

```jinja
{% set letters = "aaabbbccc" %}
{{ letters | replace("ab", "x", 2) }}
```

**Sortie**

```jinja
aaxbbccc
```

### reverse

Inverse une chaine :

**Entrée**

```jinja
{{ "abcdef" | reverse }}
```

**Sortie**

```jinja
fedcba
```

Inverse un tableau :

**Entrée**

```jinja
{% for i in [1, 2, 3, 4] | reverse %}
    {{ i }}
{% endfor %}
```

**Sortie**

```jinja
4 3 2 1
```

### round

Arrondit un nombre :

**Entrée**

```jinja
{{ 4.5 | round }}
```

**Sortie**

```jinja
5
```

Arrondit au nombre entier le plus proche (qui arrondit vers le bas) :

**Entrée**

```jinja
{{ 4 | round(0, "floor") }}
```

**Sortie**

```jinja
4
```

Spécifiez le nombre de décimales pour arrondir :

**Entrée**

```jinja
{{ 4.12346 | round(4) }}
```

**Sortie**

```jinja
4.1235
```

### safe

Marquez la valeur comme sûre, ce qui signifie que dans un environnement avec des échappements automatique,
cela permet à cette variable de ne pas être échappée.

**Entrée**

```jinja
{{ "foo http://www.example.com/ bar" | urlize | safe }}
```

**Sortie**

```jinja
foo <a href="http://www.example.com/">http://www.example.com/</a> bar
```

### selectattr (uniquement pour le cas d'un unique argument)

Filtre une suite d'objets, en appliquant un test sur l'attribut spécifié
pour chaque objet et en sélectionnant les objets où le test réussit.

Ceci est à l'opposé du filtre ```rejectattr```.

Si aucun test n'est spécifié, la valeur de l'attribut sera évaluée comme une valeur booléenne.

**Entrée**

```jinja
{% set foods = [{tasty: true}, {tasty: false}, {tasty: true}]%}
{{ foods | selectattr("tasty") | length }}
```

**Sortie**

```jinja
2
```

### slice

Découpe un itérateur et retourne une liste de listes contenant ces éléments :

**Entrée**

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

**Sortie**

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
### sort(arr, reverse, caseSens, attr)

Tri `arr` avec la fonction `arr.sort` de JavaScript. Si `reverse` est à true, le résultat
sera inversé. Le tri est insensible à la casse par défaut, mais en paramétrant `caseSens`
à true, cela le rend sensible à la casse. Si `attr` est passé, cela permettra de comparer `attr` à
chaque élément.

### string

Convertit un objet en une chaine :

**Entrée**

```jinja
{% set item = 1234 %}
{% for i in item | string | list %}
    {{ i }},
{% endfor %}
```

**Sortie**

```jinja
1,2,3,4,
```

### striptags (value, [preserve_linebreaks])

C'est similaire à
[striptags](http://jinja.pocoo.org/docs/templates/#striptags) de jinja. Si
`preserve_linebreaks` est à false (par défaut), cela enlève les balises SGML/XML et remplace
les espaces adjacents par un seul espace. Si `preserve_linebreaks` est à true,
cela normalise les espaces, en essayant de préserver les sauts de lignes originaux. Utiliser le second
comportement si vous voulez utiliser ceci `{{ text | striptags(true) | escape | nl2br }}`.
Sinon utilisez le comportement par défaut.

### sum

Rend la somme des éléments dans le tableau :

**Entrée**

```jinja
{% set items = [1,2,3] %}
{{ items | sum }}
```

**Sortie**

```jinja
6
```

### title

Met la première lettre de chaque mot en majuscule :

**Entrée**

```jinja
{{ "foo bar baz" | title }}
```

**Sortie**

```jinja
Foo Bar Baz
```

### trim

Enlève les espaces avant et après :

**Entrée**

```jinja
{{ "  foo " | trim }}
```

**Sortie**

```jinja
foo
```

### truncate

Retourne une copie tronquée de la chaîne. La longueur est spécifiée avec le premier
paramètre qui est par défaut à 255. Si le second paramètre est à true, le filtre coupera
le texte à la longueur demandée. Sinon, il enlèvera le dernier mot. Si le texte a
été en fait tronqué, cela ajoutera un des points de suspension ("...").
Un signe de suspension différent de "(...)" peut être spécifié en utilisant le troisième paramètre.

Tronque 3 caractères :

**Entrée**

```jinja
{{ "foo bar" | truncate(3) }}
```

**Sortie**

```jinja
foo(...)
```

Tronque 6 caractères et remplace "..." avec  "?" :

**Entrée**

```jinja
{{ "foo bar baz" | truncate(6, true, "?") }}
```

**Sortie**

```jinja
foo ba ?
```

### upper

Convertit la chaine en majuscules :

**Entrée**

```jinja
{{ "foo" | upper }}
```

**Sortie**

```jinja
FOO
```

### urlencode

Échappe les chaînes pour l'utiliser dans les URL, en utilisant l'encodage UTF-8.
Il accepte à la fois les dictionnaires et les chaînes régulières ainsi que les iterables par paires.

**Entrée**

```jinja
{{ "&" | urlencode }}
```

**Sortie**

```jinja
%26
```

### urlize

Convertit les URL en texte brut dans des liens cliquables :

**Entrée**

```jinja
{{ "foo http://www.example.com/ bar" | urlize | safe }}
```

**Sortie**

```jinja
foo <a href="http://www.example.com/">http://www.example.com/</a> bar
```

Tronque le texte de l'URL selon le nombre donné :

**Entrée**

```jinja
{{ "http://mozilla.github.io/" | urlize(10, true) | safe }}
```

**Sortie**

```jinja
<a href="http://mozilla.github.io/">http://moz</a>
```


### wordcount

Compte et rend le nombre de mot à l'intérieur d'une chaine :

**Entrée**

```
{% set foo = "Hello World"%}
{{ foo | wordcount }}
```

**Sortie**

```
2
```

Sinon, il est facile de lire le [code
JavaScript](https://github.com/mozilla/nunjucks/blob/master/nunjucks/src/filters.js)
qui implémente ces filtres.

{% endraw %}
