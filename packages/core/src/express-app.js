function extname(p) {
  const basenamePos = p.lastIndexOf('/');
  if (basenamePos !== -1) {
    p = p.substr(basenamePos + 1);
  }
  const extPos = p.lastIndexOf('.');
  if (extPos === -1) {
    return '';
  } else {
    return p.substr(extPos + 1);
  }
}

export function express(env, app) {
  function NunjucksView(name, opts) {
    this.name = name;
    this.path = name;
    this.defaultEngine = opts.defaultEngine;
    this.ext = extname(name);
    if (!this.ext && !this.defaultEngine) {
      throw new Error('No default engine was specified and no extension was provided.');
    }
    if (!this.ext) {
      this.name += (this.ext = (this.defaultEngine[0] !== '.' ? '.' : '') + this.defaultEngine);
    }
  }

  NunjucksView.prototype.render = function render(opts, cb) {
    env.render(this.name, opts, cb);
  };

  app.set('view', NunjucksView);
  app.set('nunjucksEnv', env);
  return env;
}
