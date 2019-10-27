'use strict';

import * as lib from './lib';
import * as compiler from './compiler';
import {FileSystemLoader, WebLoader, PrecompiledLoader} from './loaders';
import {express as expressApp} from './express-app';

import {BaseTemplate, BaseEnvironment} from './environment-base';
export {Context} from './environment-base';


export class Environment extends BaseEnvironment {
  init(loaders, opts) {
    if (!loaders) {
      // The filesystem loader is only available server-side
      if (FileSystemLoader) {
        loaders = [new FileSystemLoader('views')];
      } else if (WebLoader) {
        loaders = [new WebLoader('/views')];
      }
    } else {
      loaders = lib.isArray(loaders) ? loaders : [loaders];
    }

    // It's easy to use precompiled templates: just include them
    // before you configure nunjucks and this will automatically
    // pick it up and use it
    if (typeof window !== 'undefined' && window.nunjucksPrecompiled) {
      loaders.unshift(
        new PrecompiledLoader(window.nunjucksPrecompiled)
      );
    }

    super.init(loaders, opts, Template);
  }


  express(app) {
    return expressApp(this, app);
  }
}

export class Template extends BaseTemplate {
  init(src, env, path, eagerCompile) {
    env = env || new Environment();

    super.init(src, env, path, eagerCompile);
  }

  _compile() {
    var props;

    if (this.tmplProps) {
      props = this.tmplProps;
    } else {
      const source = compiler.compile(this.tmplStr,
        this.env.asyncFilters,
        this.env.extensionsList,
        this.path,
        this.env.opts);

      const func = new Function(source); // eslint-disable-line no-new-func
      props = func();
    }

    this.blocks = this._getBlocks(props);
    this.rootRenderFunc = props.root;
    this.compiled = true;
  }
}
