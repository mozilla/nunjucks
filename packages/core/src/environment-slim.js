'use strict';

import * as lib from '@nunjucks/common';

import {PrecompiledLoader} from './loaders';
import {BaseTemplate, BaseEnvironment} from './environment-base';
export {Context} from './environment-base';

export class Environment extends BaseEnvironment {
  init(loaders, opts) {
    loaders = loaders || [];
    loaders = lib.isArray(loaders) ? loaders : [loaders];

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
      throw new Error('Unable to compile templates in slim mode');
    }

    this.blocks = this._getBlocks(props);
    this.rootRenderFunc = props.root;
    this.compiled = true;
  }
}
