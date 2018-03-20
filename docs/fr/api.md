---
layout: subpage
title: API
---
{% raw %}

# API

L'API pour nunjucks couvre le rendu des templates, l'ajout des filtres et
des extensions, la personnalisation du chargement des templates et plus encore.

**Avertissement** : nunjucks n'a pas d'exécution de [sandbox](https://fr.wikipedia.org/wiki/Sandbox_%28s%C3%A9curit%C3%A9_informatique%29) donc il est potentiellement
  dangereux d'exécuter des templates définis par l'utilisateur. Sur le serveur, vous risquez
  des [vecteurs d'attaque](https://fr.wiktionary.org/wiki/vecteur_d%E2%80%99attaque) pour accéder aux données sensibles. Sur le client, vous risquez
  des vulnérabilités de [cross-site scripting](https://fr.wikipedia.org/wiki/Cross-site_scripting) (voir [cette
  question](https://github.com/mozilla/nunjucks-docs/issues/17) pour
  plus d'informations).


## API simplifiée

  Si vous n'avez pas besoin d'une personnalisation en profondeur du système, vous pouvez utiliser
  l'API simplifiée de haut niveau pour le chargement et le rendu des templates.

{% endraw %}
{% api %}
render
nunjucks.render(name, [context], [callback])

Rend le template nommé **name** avec le hash du **context**. Si
**callback** est fourni, il sera appelé quand cela sera terminé avec une
erreur possible en premier argument et le résultat en second.
Sinon (si callback n'est pas fourni), le résultat est retourné depuis `render` et des erreurs sont levées.
Voir le [support asynchrone](#support-asynchrone) pour plus d'informations.

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

Identique à [`render`](#render), mais rend une chaîne de caractère brute au lieu
de charger un template.

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
compile
nunjucks.compile(str, [env], [path])

Compile la chaîne donnée dans un objet Template de nunjucks qui est réutilisable.

{% raw %}
```js
var template = nunjucks.compile('Hello {{ username }}');
template.render({ username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
configure
nunjucks.configure([path], [opts]);

Dites à nunjucks que vos templates sont dans le **path** (chemin) et activez ou désactivez une
fonctionnalité avec le hash **opts**. Vous pouvez fournir les deux arguments ou l'un
des deux. Le **path** par défaut est le répertoire de travail courant
et les options suivantes sont disponibles dans **opts** :

* **autoescape** *(par défaut : true)* contrôle si l'affichage avec des caractères dangereux sont
    échappés automatiquement. Voir [Autoescaping](#autoescaping)
* **throwOnUndefined** *(par défaut : false)* lève des erreurs quand le résultat a une valeur null/undefined
* **trimBlocks** *(par défaut : false)* supprime automatiquement les sauts de lignes de fin de block/tag
* **lstripBlocks** *(par défaut : false)* supprime automatiquement les espaces de début de block/tag
* **watch** *(par défaut : false)* recharge les templates quand ils ont été changés (côté serveur). Pour utiliser watch, veuillez vérifier que la dépendance optionnelle *chokidar* soit installée.
* **noCache** *(par défaut : false)* ne jamais utiliser le cache et recompiler les templates à chaque fois (côté serveur)
* **web** un objet pour la configuration du chargement des templates dans le navigateur :
  * **useCache** *(par défaut : false)* activera le cache et les templates ne verront jamais les mises à jour.
  * **async** *(par défaut : false)* chargera les templates de manière asynchrone au lieu de façon synchrone. (Nécessite l'utilisation de [l'API asynchrone](#support-asynchrone) pour le rendu).
* **express** une app express que nunjucks doit installer
* **tags:** *(par défaut : voir la syntaxe nunjucks)* définit la syntaxe pour
    les tags de nunjucks. Voir [Personnalisation de la Syntaxe](#personnalisation-de-la-syntaxe)

`configure` retourne une instance `Environment`, qui vous permet d'ajouter des
filtres et des extensions tout en utilisant l'API simplifiée. Voir ci-dessous pour
plus d'informations sur `Environment`.

**Avertissement** : L'API simplifiée (ci-dessus, par exemple `nunjucks.render`) utilise toujours la
  configuration de l'appel le plus récent de `nunjucks.configure`. Comme cela est
  implicite et peut entraîner des effets secondaires inattendus, l'utilisation de l'API simplifiée
  est déconseillée dans la plupart des cas (surtout si `configure` est utilisé). A la place,
  créez explicitement un environnement en utilisant `var env = nunjucks.configure(...)`
  et ensuite appeler `env.render(...)` etc.

```js
nunjucks.configure('views');

// dans le navigateur, vous voudrez probablement utiliser une URL absolue
nunjucks.configure('/views');

nunjucks.configure({ autoescape: true });

nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: true
});

var env = nunjucks.configure('views');
// faire quelque chose avec env
```

{% endapi %}

{% api %}
installJinjaCompat
nunjucks.installJinjaCompat()

Cela installe un support expérimental pour une compatibilité plus cohérente avec
Jinja en ajoutant les APIs Pythonic à l'environnement. Bien que nunjucks
ne visent pas une compatibilité complète de Jinja/Python, cela pourra
aider les utilisateurs qui le recherchent au plus juste.

Cela ajoute `True` et `False` qui correspond aux valeurs `true` et `false`
de JS. En plus, cela se rapproche des tableaux et des objets pour les méthodes
avec un style Python et permet également l'utilisation de la syntaxe "slice" Python.
[Vérifiez la source](https://github.com/mozilla/nunjucks/blob/master/nunjucks/src/jinja-compat.js)
pour voir tout ce qu'il ajoute.
{% endapi %}
{% raw %}

*Voilà pour l'API simplifiée ! Si vous voulez un contrôle total sur la façon dont
les templates sont chargés, et plus de personnalisation, vous devez configurer manuellement
le système comme on l'explique ci-dessous.*

## Environment

La classe `Environment` est l'objet central qui gère les templates.
Elle sait comment charger vos templates, ainsi que les templates internes
qui leur dépendent soit par l'héritage ou par une inclusion. L'API simplifiée
ci-dessus fournit tout à une instance `Environment` qu'elle conserve
pour vous.

Si vous voulez, vous pouvez le gérer manuellement, cela vous permet de spécifier
des chargeurs de templates personnalisés.

{% endraw %}
{% api %}
constructor
new Environment([loaders], [opts])

Le constructeur prend une liste de **loaders** (chargeurs) et un hash de
paramètres de configuration **opts**. Si **loaders** est null, sa valeur par
défaut pour le chargement est le répertoire ou l'URL courant. Vous pouvez passer
un seul chargeur ou un tableau de chargeurs. Si vous passez un tableau de chargeurs,
nunjucks le parcourra dans l'ordre jusqu'à ce que l'un d'eux trouve un
template. Voir [`Chargeur`](#chargeur) pour plus d'informations sur les chargeurs.

Les paramètres disponibles dans **opts** sont **autoescape**,
**throwOnUndefined**, **trimBlocks** et **lstripBlocks**. Pour en
savoir plus sur ces options, regardez dans [`configure`](#configure) (les
options express et watch ne sont pas applicables ici et sont configurées
ailleurs comme [`env.express`](#express)).

Dans node, le [`FileSystemLoader`](#filesystemloader) est disponible pour
charger les templates via le système de fichiers et dans le navigateur le [`WebLoader`](#webloader)
est disponible pour charger via HTTP (ou utilise des templates précompilés). Si vous
utilisez l'API de configuration simplifiée, nunjucks crée  pour vous
automatiquement le chargeur approprié, selon si vous êtes dans node ou dans
le navigateur. Voir [`Chargeur`](#chargeur) pour plus d'informations.

```js
// Le FileSystemLoader est disponible si on est dans node
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'),
                          { autoescape: false });

var env = new nunjucks.Environment([new nunjucks.FileSystemLoader('views'),
                           new MyCustomLoader()]);

// Le WebLoader est disponible si on est dans le navigateur
var env = new nunjucks.Environment(new nunjucks.WebLoader('/views'));
```
{% endapi %}

{% api %}
render
env.render(name, [context], [callback])

Rend le template nommé **name** avec le hash facultatif **context**. Si
**callback** est fourni, il est appelé lorsque c'est terminé avec toutes
les erreurs et le résultat (voir le [support asynchrone](#support-asynchrone)),
sinon cela retourne la chaîne rendue.

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

Identique à [`render`](#render1), mais rend une chaîne de caractère brute au lieu
de charger un template.

{% raw %}
```js
var res = nunjucks.renderString('Hello {{ username }}', { username: 'James' });
```
{% endraw %}
{% endapi %}

{% api %}
addFilter
env.addFilter(name, func, [async])

Ajoute un filtre personnalisé nommé **name** qui appelle **func** à chaque fois
qu'il est appelé. Si le filtre doit être asynchrone, **async** doit être à `true`
(voir le [support asynchrone](#support-asynchrone)). Retourne `env` pour chaîner d'autres méthodes. Voir
[Filtres personnalisés](#filtres-personnaliss).

{% endapi %}

{% api %}
getFilter
env.getFilter(name)
Récupère le filtre, qui est juste une fonction, nommé **name**.
{% endapi %}

{% api %}
addExtension
env.addExtension(name, ext)

Ajoute l'extension personnalisée **ext** nommée **name**. **ext** est un objet
avec quelques méthodes spécifiques qui sont appelés par le système d'extension. Retourne `env` pour chaîner d'autres méthodes.
Voir les [Tags personnalisés](#tags-personnaliss).

{% endapi %}

{% api %}
removeExtension
env.removeExtension(name)

Supprime une extension personnalisée nommée **name** ajoutée précédemment.

{% endapi %}

{% api %}
getExtension
env.getExtension(name)
Récupère une extension nommée **name**.
{% endapi %}

{% api %}
hasExtension
env.hasExtension(name)
Retourne true si une extension personnalisée nommée **name** a été ajoutée.
{% endapi %}

{% api %}
addGlobal
env.addGlobal(name, value)
Ajoute une valeur globale qui sera disponible pour tous les templates. Remarque : ceci écrasera toute valeur globale nommée `name`.
Retourne `env` pour chaîner d'autres méthodes.
{% endapi %}

{% api %}
getGlobal
env.getGlobal(name)
Retourne une valeur globale nommée **name**.
{% endapi %}

{% api %}
getTemplate
env.getTemplate(name, [eagerCompile], [callback])

Récupère le template nommé **name**. Si **eagerCompile** est à `true`,
ça le compile maintenant au lieu de le rendre. Si **callback** est fourni, il
est appelé avec les erreurs et un template (si trouvé), sinon il le retourne de
façon synchrone. Si vous utilisez des chargeurs asynchrones, vous devez utiliser
l'API asynchrone. Les chargeurs intégrés ne nécessitent pas cela. Voir le
[support asynchrone](#support-asynchrone) et les [chargeurs](#chargeur).

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

Installe nunjucks comme moteur de rendu pour l'**app** express. Après
avoir fait cela, vous pouvez utiliser express normalement. Remarquez que vous pouvez le
faire automatiquement avec l'API simplifiée par l'appel de [`configure`](#configure)
en passant dans l'app l'option **express**. Retourne `env` pour chaîner d'autres méthodes.

```js
var app = express();
env.express(app);

app.get('/', function(req, res) {
    res.render('index.html');
});
```
{% endapi %}

{% api %}
opts.autoescape
env.opts.autoescape

Vous pouvez utiliser cette propriété booléenne pour voir si autoescaping est activé
ou non globalement. Cela peut être utile lors de la création de filtres avancés qui
manipule du HTML. Normalement, vous devriez tout simplement retournez une
chaîne sécurisée (pour être documenté) si l'on passe dedans, afin que la sortie soit
une  copie sécurisée de l'entrée, mais cette propriété est utile dans
de rares circonstances.
{% endapi %}
{% raw %}

## Template

Un `Template` est un objet qui gère la compilation des chaînes de template
et les rend. Habituellement `Environment` les gère pour vous,
mais vous pouvez facilement l'utiliser vous-même. Si vous ne connectez pas un
template avec un environnement, vous ne pouvez pas l'inclure ou l'hériter
à d'autres templates.

{% endraw %}
{% api %}
constructor
new Template(src, [env], [path], [eagerCompile])

Le constructeur prend une chaîne de template **src**, une instance
facultative `Environment` **env** à utiliser pour le chargement des autres templates, une
chaîne **path** décrivant l'emplacement/chemin afin de déboguer et
un booléen **eagerCompile** qui, s'il est à `true`, débutera la compilation
immédiatement au lieu d'attendre que le modèle soit rendu.

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

Rend le template avec le hash facultatif **context**. Si
**callback** est fourni, il l'appelle quand cela sera terminé avec les erreurs et le
résultat (Voir le [support asynchrone](#support-asynchrone)), sinon il
retourne la chaîne rendu.

{% endapi %}
{% raw %}

## Chargeur

Un chargeur est un objet qui prend un nom de template et le charge à partir d'une
source, comme le système de fichiers ou le réseau. Les deux chargeurs intégrés
suivants existent, chacun pour des contextes différents.

{% endraw %}
{% api %}
FileSystemLoader
new FileSystemLoader([searchPaths], [opts])

Ceci est uniquement disponible sur node. Il chargera les templates depuis
le système de fichiers, en utilisant le tableau **searchPaths** comme chemins
pour chercher des templates. **searchPaths** peut aussi avoir un chemin unique pour
tous les templates et il est par défaut dans le répertoire de travail courant.

**opts** est un objet avec les propriétés optionnelles suivantes :

* **watch** - si `true`, le système mettra à jour automatiquement les templates. Pour utiliser watch, veuillez vérifier que la dépendance optionnelle *chokidar* soit installée.
  quand ils sont modifiés sur le système de fichiers
* **noCache** - si `true`, le système évitera l'utilisation d'un cache et les
  templates seront recompilés à chaque fois

```js
// Charge les templates depuis le répertoire "views"
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
```

{% endapi %}

{% api %}
WebLoader
new WebLoader([baseURL], [opts])

Ceci est uniquement disponible dans le navigateur. **baseURL** est l'URL pour charger
les templates (cela doit être sur le même domaine) et il est par défaut le
répertoire relatif courant.

**opts** est un objet avec les propriétés optionnelles suivantes :

* **useCache** si `true`, les templates seront toujours mis en cache et vous
    ne leur verrez pas se mettre à jour. Le cache est désactivé par défaut car
    il n'y a aucun moyen de voir les changements et le "dirty" cache.
    Souvenez-vous que vous devez précompiler vos templates pour la production.
* **async** si `true`, les templates seront chargés de manière asynchrone au lieu
    de synchrone. Vous devez utiliser l'API render de manière asynchrone lors de
    l'utilisation de ceci (passez un callback à `render`).

Ce chargeur reconnaît également lorsque les templates précompilés sont disponibles
et les utilise automatiquement au lieu d'aller les chercher sur HTTP. En
production, cela devrait toujours être le cas. Voir
[Précompilation](#prcompilation).

```js
// Charge les templates depuis /views
var env = new nunjucks.Environment(new nunjucks.WebLoader('/views'))
```
{% endapi %}
{% raw %}

### Écriture d'un chargeur

Vous pouvez écrire des chargeurs pour des utilisations plus complexes comme la récupération à partir d'une base de données.
Si vous voulez faire cela, il suffit de créer un objet qui a une méthode
`getSource(name)`, où **name** est le nom du template. C'est tout.

```js
function MyLoader(opts) {
    // configuration
}

MyLoader.prototype.getSource = function(name) {
    // charge le template
    // retourne un objet avec :
    //   - src :     String. La source du template.
    //   - path :    String. Le chemin vers le template.
    //   - noCache : Bool.   Ne met pas en cache le template (facultatif).
}
```

Cela peut devenir un peu plus complexe, si vous souhaitez suivre les mises à jour des
templates et détruire le cache interne de sorte que vous puissiez voir les mises à jour : vous
devez étendre la classe `Loader`. Ceci vous permet d'émettre une méthode qui peut
déclencher des événements. Vous avez besoin de l'appeler ainsi

```js
var MyLoader = nunjucks.Loader.extend({
    init: function() {
        // configure un processus qui regarde ici les templates
        // et appelle `this.emit('update', name)` lorsqu'un template
        // est modifié
    },

    getSource: function(name) {
        // charge le template
    }
});
```

#### Asynchrone

Il y a un dernier point : les chargeurs asynchrones. Jusqu'à présent, tous les
chargeurs étaient synchrones, `getSource` retourne la source immédiatement.
L'avantage de ceci est que l'utilisateur n'est pas obligé d'utiliser l'API
asynchrone et il n'a pas à se soucier des effets de bords des templates asynchrones.
Cependant, vous pouvez en avoir besoin pour charger à partir d'une base de données.

Il suffit d'ajouter une propriété `async: true` à votre chargeur et il sera
utilisé de façon asynchrone.

```js
var MyLoader = nunjucks.Loader.extend({
    async: true,

    getSource: function(name, callback) {
        // charge le template
        // ...
        callback(err, res);
    }
});
```

N'oubliez pas que vous devez maintenant utiliser l'API asynchrone. Voir
le [support asynchrone](#support-asynchrone).

**Attention** : Si vous utilisez un chargeur asynchrone, vous ne pouvez pas charger
  des templates à l'intérieur des boucles `for`. Vous devez explicitement utiliser le
  tag `asyncEach` si vous avez besoin de charger des templates, c'est exactement le
  même que `for` mais asynchrone. Plus d'informations se trouvent dans
  [Soyez prudent !](#soyez-prudent-).


## Utilisation dans un navigateur

L'utilisation de nunjucks dans le navigateur demande une réflexion plus approfondie, car vous
devez vous souciez du chargement et du temps de compilation. Du côté du serveur, les templates sont
compilés une fois et mis en mémoire cache, donc vous n'aurez jamais à vous inquiéter de ce sujet.
Cependant du côté du client, vous ne voulez pas compiler les templates, même une fois,
car le rendu de la page serait très lent.

La solution est de précompiler vos templates en JavaScript et de les charger
dans un simple fichier `.js` lors du chargement de la page.

Peut-être que vous voulez charger dynamiquement des templates lors du développement,
afin que vous puissiez voir immédiatement les modifications sans recompilation.
Nunjucks essaye de s'adapter à ce flux de travail voulu.

La seule règle que vous devez suivre : **toujours précompiler vos templates en
production**. Pourquoi ? Non seulement c'est lent de compiler tous vos templates
sur la page de chargement, mais ils sont chargés de *manière synchrone* sur HTTP,
ce qui bloque toute la page. C'est lent. C'est parce nunjucks n'est pas asynchrone
par défaut.

### Configurations recommandées

Ce sont les deux moyens les plus populaires pour mettre en place nunjucks
côté client. Notez qu'il y a deux fichiers js différents : l'un avec le
compilateur nunjucks.js, et l'autre sans le compilateur nunjucks-slim.js.
Lisez [Prise en main](getting-started.html) pour un bref aperçu des
différences.

Voir [Précompilation](#prcompilation) pour des informations sur la
précompilation des templates.

#### Configuration n°1 : précompilé uniquement en production

Cette méthode vous donnera une configuration qui charge dynamiquement les templates
lors du développement (vous pouvez voir immédiatement les changements), mais utilise
des templates précompilés en production.

1. Chargez [nunjucks.js](../files/nunjucks.js) soit avec une balise script ou un chargeur de module.
2. Rendez les templates ([par exemple](#api-simplifie))!
3. Lorsque vous mettez en production, [précompilez](#prcompilation) les templates dans un fichier js
   et chargez les dans la page

> Une optimisation est d'utiliser `nunjucks-slim.js` au lieu de
> `nunjucks.js` en production puisque vous utilisez ici des templates
> précompilés. Il fait 8K au lieu de 20K parce qu'il ne contient pas
> le compilateur. Cela complique la configuration car vous utilisez
> des fichiers js différents entre la dev et la prod, ça vaut peut-être
> le coup ou pas.

#### Configuration n°2 : toujours précompilé

Cette méthode utilise toujours des templates précompilés lors du développement et en
production, ce qui simplifie la configuration. Cependant, vous allez vouloir quelque
chose qui recompile automatiquement les templates lors du développement sauf si
vous voulez les recompiler manuellement après chaque changement.

1. Pour le développement, utilisez les tâches [grunt](https://github.com/jlongster/grunt-nunjucks) ou [gulp](https://github.com/sindresorhus/gulp-nunjucks) qui surveilleront
les modifications de votre répertoire de template et automatiquement les [précompileront](#prcompilation)
dans un fichier js
2. Chargez [nunjucks-slim.js](../files/nunjucks-slim.js) et `templates.js`, ou tout ce que vous avez
nommé comme fichier js précompilé, avec soit une balise script ou un chargeur de module.
3. Rendez les templates ([par exemple](#api-simplifie))!

Avec cette méthode, il n'y a pas de différences entre le développement et
le code de la production. Il suffit de valider le fichier de templates.js et
déployer le même code pour la production.

## Précompilation

Pour précompiler vos templates, utilisez le script `nunjucks-precompile`
fourni avec nunjucks. Vous pouvez passer un répertoire ou un fichier et il
générera tout le JavaScript pour vos templates.

```
// Précompilation d'un répertoire entier
$ nunjucks-precompile views > templates.js

// Précompilation des templates individuellement
$ nunjucks-precompile views/base.html >> templates.js
$ nunjucks-precompile views/index.html >> templates.js
$ nunjucks-precompile views/about.html >> templates.js
```

Tout ce que vous avez à faire, c'est simplement de charger templates.js
sur la page, et le système utilisera automatiquement les modèles
précompilés. Aucun changement n'est nécessaire.

Il existe diverses options disponibles pour le script. Appelez simplement
`nunjucks-precompile` pour voir plus d'informations sur eux. Notez que les **noms
de tous les filtres asynchrones doivent être passés au script**, car ils doivent
être connus au moment de la compilation. Vous pouvez passer une liste de filtres
asynchrones séparés par des virgules avec `-a`, tel que `-a foo,bar,baz`. Si vous
utilisez uniquement des filtres synchrones normaux, vous ne devez rien faire.

Les extensions ne peuvent pas être spécifiées avec ce script. Vous devez utiliser
l'API précompile ci-dessous si vous les utilisez.

### API

Il existe également une API, si vous voulez des templates précompilés par
programmation. Vous aurez envie de faire cela si vous utilisez des extensions ou si
vous utilisez des filtres asynchrones, car dans les deux cas, ils ont besoin d'être
connus au moment de la compilation. Vous pouvez passer un objet `Environment` directement
dans le précompilateur et cela récupérera les extensions et les filtres. Vous devez
partager le même objet `Environment` entre le client et le serveur pour
que tout reste synchronisé.

{% endraw %}
{% api %}
precompile
nunjucks.precompile(path, [opts])

Précompile un fichier ou un répertoire depuis **path**. **opts** est un hash avec les options suivantes :

* **name**: nom du template, lors de la compilation d'une chaîne (obligatoire)
    ou un fichier (optionnel, par défaut **path**). Les noms sont
    générés automatiquement lors de la compilation d'un répertoire.
* **asFunction**: génère une fonction appelable
* **force**: continuer la compilation en cas d'erreur
* **env**: un environnement à utiliser (on récupère via ce dernier les extensions et les filtres asynchrone)
* **include**: un tableau de fichiers/dossiers à inclure (les dossiers sont automatiquement inclus, les fichiers sont automatiquement exclus)
* **exclude**: un tableau de fichiers/dossiers à exclure (les dossiers sont automatiquement inclus, les fichiers sont automatiquement exclus)
* **wrapper**: `function(templates, opts)` Personnalise le format de sortie des templates précompilés. Cette fonction doit renvoyer un string
    * **templates**: un tableau d'objets avec les propriétés suivantes :
        * **name**: nom du template
        * **template**: la chaine du source du template précompilé en javascript
    * **opts**: objet de toutes les options ci-dessus

```js
var env = new nunjucks.Environment();

// les extensions doivent être connues au moment de la compilation
env.addExtension('MyExtension', new MyExtension());

// les filtres asynchrones doivent être connus au moment de la compilation
env.addFilter('asyncFilter', function(val, cb) {
  // faire quelque chose
}, true);

nunjucks.precompile('/dir/to/views', { env: env });
```
{% endapi %}

{% api %}
precompileString
nunjucks.precompileString(str, [opts])


Exactement le même que [`precompile`](#precompile), mais il compile une chaîne brute.

{% endapi %}
{% raw %}

## Support Asynchrone

Vous avez besoin de lire cette section seulement si vous êtes intéressé par le
rendu asynchrone. Il n'y a aucun avantage en termes de performance, il doit uniquement
permettre aux filtres et aux extensions personnalisées de faire des appels asynchrones. Si
vous ne vous souciez pas de cela, vous devez simplement utiliser l'API normal tel que
`var res = env.render('foo.html');`. Il n'y a pas besoin de forcer le
`callback`, et c'est pourquoi il est facultatif dans toutes les fonctions
de rendu.

Depuis la version 1.0, nunjucks fournit un moyen de rendre les templates de
manière asynchrone. Cela signifie que les filtres et extensions personnalisées peuvent faire
des choses comme aller chercher des données à partir d'une base de données et le rendu
du template est "suspendu" jusqu'à ce que le callback soit appelé.

Les chargeurs de template peuvent ainsi être asynchrones, vous permettant de charger des
templates à partir d'une base de données ou autres. Voir
[Écriture d'un chargeur](#criture-d39un-chargeur). Si vous utilisez un chargeur de template
asynchrone, vous devez utiliser l'API asynchrone. Les chargeurs intégrés qui chargent depuis le
système de fichiers et sur HTTP sont synchrones, ils n'ont pas de problème de performance, car
ils sont mis en cache depuis le système de fichiers et vous devez précompiler vos templates et
ne jamais utiliser le protocole HTTP en production.

Si vous utilisez quelque chose d'asynchrone, vous devez utiliser l'API asynchrone comme ceci :

```js
nunjucks.render('foo.html', function(err, res) {
   // vérifie err et gère le résultat
});
```

En savoir plus sur les [`filtres`](#asynchrone1), les [`extensions`](#asynchrone2) et les
[`chargeurs`](#asynchrone) asynchrones.

### Soyez prudent !

Nunjucks est synchrone par défaut. Pour cette raison, vous devez suivre
quelques règles lors de l'écriture des templates asynchrones :

* Toujours utiliser l'API asynchrone. `render` doit prendre une fonction qui prend
  un callback.
* Les filtres et les extensions asynchrones doivent être connus au moment de la compilation, si
  vous devez les spécifier explicitement lors de la précompilation (voir
  [Précompilation](#prcompilation)).
* Si vous utilisez un chargeur de template personnalisé qui est asynchrone, vous
  ne pouvez pas inclure des templates à l'intérieur d'une boucle `for`. C'est parce
  que `for` se compilera en une boucle `for` de JavaScript impératif. Vous devez
  utiliser explicitement le tag asynchrone `asyncEach` pour itérer, qui est
  exactement le même que le `for` synchrone.

## Autoescaping

Par défaut, nunjucks échappera toutes les sorties. Il est recommandé
de le faire pour des raisons de sécurité. Si autoescaping est désactivé,
nunjucks rendra par défaut toutes les sorties telles quelles.

Pour le désactiver, tout ce que vous avez à faire, c'est de passer
l'option `autoescape` à `false` sur l'objet `Environment`.

```js
var env = nunjucks.configure('/path/to/templates', { autoescape: false });
```

## Personnalisation de la syntaxe

Si vous souhaitez des marqueurs (tokens) différent de `{{` ainsi que pour les variables,
les blocs et les commentaires, vous pouvez spécifier des marqueurs différents avec l'option
`tags` :

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

En utilisant cet environnement, les templates ressembleront à ça :

```
<ul>
<% for item in items %>
  <li><$ item $></li>
<% endfor %>
</ul>
```

## Filtres personnalisés

Pour installer un filtre personnalisé, utilisez la méthode `addFilter` de `Environment`.
Un filtre est tout simplement une fonction qui prend l'objet visé comme premier
argument et n'importe quels arguments qui seront transmis dans l'ordre au filtre
comme d'autres arguments.

```js
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
});
```

Cela ajoute un filtre `shorten` qui renvoie les `count` premiers
caractères dans une chaîne, où `count` est par défaut à 5. Voici comment
il est utilisé :

```jinja
{# Affiche les 5 premiers caractères #}
Un message pour vous : {{ message|shorten }}

{# Affiche les 20 premiers caractères #}
Un message pour vous : {{ message|shorten(20) }}
```

### Arguments avec Mots clefs/Par défaut

Comme décrit dans la section
[templating](templating.html#arguments-avec-mots-clefs), nunjucks supporte
les arguments avec Mots clefs/Par défaut. Vous pouvez écrire un filtre javascript
qui les exploite.

Tous les arguments avec mots clefs sont transmis en tant que hash comme dernier argument.
Voici le filtre `foo` qui utilise des arguments avec mots clefs :

```js
env.addFilter('foo', function(num, x, y, kwargs) {
   return num + (kwargs.bar || 10);
})
```

Le template peut l'utiliser ainsi :

```jinja
{{ 5 | foo(1, 2) }}          -> 15
{{ 5 | foo(1, 2, bar=3) }}   -> 8
```

Vous *devez* passer tous les arguments de position avant les arguments avec mots
clefs (`foo(1)` est valide, mais `foo(1, bar=10)` ne l'est pas). Donc, vous ne
pouvez pas définir un argument de position avec un argument avec mots clefs, bien
que cela soit possible en Python (comme `foo(1, y=1)`).

### Asynchrone

Les filtres asynchrones reçoivent un callback pour s'occuper du rendu et ils sont
créés en passant `true` au troisième argument de `addFilter`.

```js
var env = nunjucks.configure('views');

env.addFilter('lookup', function(name, callback) {
    db.getItem(name, callback);
}, true);

env.renderString('{{ item|lookup }}', function(err, res) {
    // faire quelque chose avec res
});
```

Assurez-vous d'appeler la fonction callback avec deux arguments : `callback(err, res)`. `err` peut être évidemment null.

Remarque: Lors de la précompilation, **vous devez indiquer au précompilateur les noms de
tous les filtres asynchrones**. Voir
[Précompilation](#prcompilation).

## Tags personnalisés

Vous pouvez créer des extensions plus complexes en créant des tags personnalisés.
Cela vous permet d'utiliser l'API du parser (analyseur) et vous permet de faire tout
ce que vous voulez avec le template.

Remarque: Lors de la précompilation, **vous devez installer les extensions pour
la compilation**. Vous devez utiliser l'API de [précompilation](#api1) (ou les tâches [grunt](https://github.com/jlongster/grunt-nunjucks) ou
[gulp](https://github.com/sindresorhus/gulp-nunjucks)) à la place du
script. Vous devrez créer un objet [`Environment`](#environment),
installez vos extensions et les transmettre au précompilateur.

Une extension est un objet javaScript avec au moins deux champs : `tags`
et `parse`. Les extensions enregistrent de nouveaux noms de tags et prennent
le contrôle de l'analyseur quand ils sont utilisés.

`tags` est un tableau de noms de tag gérés par l'extension.
`parse` est la méthode qui les analyse lorsque le template est
compilé. De plus, il y a un type de nœud spécial : `CallExtension`
qui vous permet d'appeler n'importe quelle méthode sur votre extension
lors de l'exécution. Ceci est expliqué plus bas.

Comme vous vous devez interagir directement avec la fonction parse de l'API et construire
les ASTs manuellement, c'est un peu fastidieux. Malheureusement, c'est nécessaire si vous voulez
faire des choses vraiment complexe. Voici quelques méthodes de l'analyseur
que vous aurez besoin d'utiliser :

* `parseSignature([throwErrors], [noParens])` - Analyse une liste d'arguments.
  Par défaut, cela oblige l'analyseur à se positionner sur la gauche de la
  parenthèse ouvrante et d'analyser jusqu'à celle fermante. Toutefois, pour
  les tags personnalisées, vous ne devriez pas utiliser des parenthèses, donc en passant
  `true` au deuxième argument, cela indique qu'il faut analyser une liste d'arguments
  jusqu'à la fin du bloc du tag. Une virgule est nécessaire entre les arguments. Exemple : `{%
  mytag foo, bar, baz=10 %}`

* `parseUntilBlocks(names)` - Analyse le contenu jusqu'à ce qu'il arrive à un bloc
  avec un nom dans le tableau `names`. Ceci est utile pour l'analyse de contenu entre
  les tags.

L'API de l'analyseur doit être plus documenté, mais pour l'instant lisez ce qui précède
et vérifiez l'exemple ci-dessous. Vous pouvez également regarder le code
[source](https://github.com/mozilla/nunjucks/blob/master/nunjucks/src/parser.js).

L'utilisation la plus courante consiste à traiter à l'exécution le contenu
de certains tags. C'est comme les filtres, mais sous stéroïdes car vous ne vous
limitez pas à une seule expression. La plupart du temps, vous souhaitez analyser
légèrement le template, puis d'obtenir un callback dans votre extension avec le
contenu. Cela se fait avec le nœud `CallExtension`, qui prend une instance
d'extension, une méthode à appeler, une liste d'arguments analysés
dans le tag et une liste des blocs de contenu (analysée avec
`parseUntilBlocks`).

Par exemple, voici comment vous pourriez mettre en œuvre une extension qui récupère
le contenu à partir d'une URL et l'injecte dans la page :

```js
function RemoteExtension() {
    this.tags = ['remote'];

    this.parse = function(parser, nodes, lexer) {
        // récupère le marqueur du tag
        var tok = parser.nextToken();

        // analyse les arguments et se déplace après le bloc de fin. Passer à true
        // le second argument est obligatoire s'il n'y a pas de parenthèses
        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        // analyser le corps et éventuellement, le bloc error, qui est facultatif
        var body = parser.parseUntilBlocks('error', 'endremote');
        var errorBody = null;

        if(parser.skipSymbol('error')) {
            parser.skip(lexer.TOKEN_BLOCK_END);
            errorBody = parser.parseUntilBlocks('endremote');
        }

        parser.advanceAfterBlockEnd();

        // Voir ci-dessus pour des notes sur CallExtension
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

Utilisez-le ainsi :

```jinja
{% remote "/stuff" %}
  Ce contenu sera remplacé par le contenu de /stuff
{% error %}
  Il y avait une erreur récupération pour /stuff
{% endremote %}
```

### Asynchrone

Un autre nœud est disponible : `CallExtensionAsync` qui est une
version asynchrone de `CallExtension`.  A l'exécution, il appelle votre
extension, avec un paramètre supplémentaire: un callback. Le rendu
du template est "suspendu" jusqu'à ce que le callback soit appelé.

La fonction `run` de l'exemple précédent ressemblerait à cela :

```js
this.run = function(context, url, body, errorBody, callback) {
   // faire quelque chose d'asynchrone et appeler callback(err, res)
};
```

Si vous créez quelque chose d'intéressant, veuillez l'
[ajouter au wiki !](https://github.com/mozilla/nunjucks/wiki/Custom-Tags)

{% endraw %}
