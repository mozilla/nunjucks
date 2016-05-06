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

## File Extensions

Bien que vous soyez libre d'utiliser n'importe quelle extension de fichier pour vos
fichiers de template Nunjucks, la communauté de Nunjucks a adopté `.njk`.  

Si vous développez des outils ou des aides de syntaxe pour éditeur pour Nunjucks,
veuillez inclure la reconnaissance de l'extension `.njk`.

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
[ajouter vos propres filtres](api.html#filtres-personnaliss).

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

Vous pouvez spécifier des conditions alternatives avec `elif` et `else` :

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
`raw` et tout ce qui sera à l'intérieur de celui-ci sera afficher au format texte brut.

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
moins (`-`) sur le tag de début ou de fin..

```jinja
{% for i in [1,2,3,4,5] -%}
  {{ i }}
{%- endfor %}
```

L'affichage exact de l'exemple du dessus sera "12345". Le `-%}` enlève les espaces à
droite après le tag et le `{%-` enlève les espaces à gauche avant le tag.

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

### Appels de fonction

Si vous avez passé une méthode javascript à votre template, vous pouvez l'appeler
normalement.

```jinja
{{ foo(1, 2, 3) }}
```

### Expressions régulières

Une expression régulière peut être créée comme en JavaScript :

```
{{ /^foo.*/ }}
{{ /bar$/g }}
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

Nunjucks a porté la plupart des filtres de jinja, et il a ses propres filtres. Nous avons besoin
de travailler sur notre documentation pour les filtres. Certains d'entre eux sont documentés
ci-dessous, pour le reste, vous pouvez cliquer sur le site de jinja.

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

### sort(arr, reverse, caseSens, attr)

Tri `arr` avec la fonction `arr.sort` de JavaScript. Si `reverse` est à true, le résultat
sera inversé. Le tri est insensible à la casse par défaut, mais en paramétrant `caseSens`
à true, cela le rend sensible à la casse. Si `attr` est passé, cela permettra de comparer `attr` à
chaque élément.

### striptags (value, [preserve_linebreaks])

C'est similaire à
[striptags](http://jinja.pocoo.org/docs/templates/#striptags) de jinja. Si
`preserve_linebreaks` est à false (par défaut), cela enlève les balises SGML/XML et remplace
les espaces adjacents par un seul espace. Si `preserve_linebreaks` est à true,
cela normalise les espaces, en essayant de préserver les sauts de lignes originaux. Utiliser le second
comportement si vous voulez utiliser ceci `{{ text | striptags | nl2br }}`. Sinon
utilisez le comportement par défaut.

### dump (object)

Appelle `JSON.stringify` sur un objet et déverse le résultat dans le
template. C'est utile pour le débogage : `{{ foo | dump }}`.

### Plus de filtres

* [abs](http://jinja.pocoo.org/docs/templates/#abs)
* [batch](http://jinja.pocoo.org/docs/templates/#batch)
* [capitalize](http://jinja.pocoo.org/docs/templates/#capitalize)
* [center](http://jinja.pocoo.org/docs/templates/#center)
* [dictsort](http://jinja.pocoo.org/docs/templates/#dictsort)
* [escape](http://jinja.pocoo.org/docs/templates/#escape) (raccourci avec `e`)
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
* [rejectattr](http://jinja.pocoo.org/docs/templates/#rejectattr) (seulement pour le formulaire avec un unique argument)
* [replace](http://jinja.pocoo.org/docs/templates/#replace) (le premier argument peut prendre une expression régulière JS)
* [reverse](http://jinja.pocoo.org/docs/templates/#reverse)
* [round](http://jinja.pocoo.org/docs/templates/#round)
* [safe](http://jinja.pocoo.org/docs/templates/#safe)
* [selectattr](http://jinja.pocoo.org/docs/templates/#selectattr) (seulement pour le formulaire avec un unique argument)
* [slice](http://jinja.pocoo.org/docs/templates/#slice)
* [string](http://jinja.pocoo.org/docs/templates/#string)
* [sum](http://jinja.pocoo.org/docs/dev/templates/#sum)
* [title](http://jinja.pocoo.org/docs/templates/#title)
* [trim](http://jinja.pocoo.org/docs/templates/#trim)
* [truncate](http://jinja.pocoo.org/docs/templates/#truncate)
* [upper](http://jinja.pocoo.org/docs/templates/#upper)
* [urlize](http://jinja.pocoo.org/docs/templates/#urlize)
* [urlencode](http://jinja.pocoo.org/docs/templates/#urlencode)
* [wordcount](http://jinja.pocoo.org/docs/templates/#wordcount)

Sinon, il est facile de lire le [code
JavaScript](https://github.com/mozilla/nunjucks/blob/master/src/filters.js)
qui implémente ces filtres.

{% endraw %}
