/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const Loader = require('./loader');
const {PrecompiledLoader} = require('./precompiled-loader.js');
let chokidar;

class FileSystemLoader extends Loader {
  constructor(searchPaths, opts) {
    super();
    if (typeof opts === 'boolean') {
      console.log(
        '[nunjucks] Warning: you passed a boolean as the second ' +
        'argument to FileSystemLoader, but it now takes an options ' +
        'object. See http://mozilla.github.io/nunjucks/api.html#filesystemloader'
      );
    }

    opts = opts || {};
    this.pathsToNames = {};
    this.noCache = !!opts.noCache;

    if (searchPaths) {
      searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];
      // For windows, convert to forward slashes
      this.searchPaths = searchPaths.map(path.normalize);
    } else {
      this.searchPaths = ['.'];
    }

    if (opts.watch) {
      // Watch all the templates in the paths and fire an event when
      // they change
      try {
        chokidar = require('chokidar'); // eslint-disable-line global-require
      } catch (e) {
        throw new Error('watch requires chokidar to be installed');
      }
      const paths = this.searchPaths.filter(fs.existsSync);
      const watcher = chokidar.watch(paths);
      watcher.on('all', (event, fullname) => {
        fullname = path.resolve(fullname);
        if (event === 'change' && fullname in this.pathsToNames) {
          this.emit('update', this.pathsToNames[fullname], fullname);
        }
      });
      watcher.on('error', (error) => {
        console.log('Watcher error: ' + error);
      });
    }
  }

  getSource(name) {
    var fullpath = null;
    var paths = this.searchPaths;

    for (let i = 0; i < paths.length; i++) {
      const basePath = path.resolve(paths[i]);
      const p = path.resolve(paths[i], name);

      // Only allow the current directory and anything
      // underneath it to be searched
      if (p.indexOf(basePath) === 0 && fs.existsSync(p)) {
        fullpath = p;
        break;
      }
    }

    if (!fullpath) {
      return null;
    }

    this.pathsToNames[fullpath] = name;

    const source = {
      src: fs.readFileSync(fullpath, 'utf-8'),
      path: fullpath,
      noCache: this.noCache
    };
    this.emit('load', name, source);
    return source;
  }
}

class NodeResolveLoader extends Loader {
  constructor(opts) {
    super();
    opts = opts || {};
    this.pathsToNames = {};
    this.noCache = !!opts.noCache;

    if (opts.watch) {
      try {
        chokidar = require('chokidar'); // eslint-disable-line global-require
      } catch (e) {
        throw new Error('watch requires chokidar to be installed');
      }
      this.watcher = chokidar.watch();

      this.watcher.on('change', (fullname) => {
        this.emit('update', this.pathsToNames[fullname], fullname);
      });
      this.watcher.on('error', (error) => {
        console.log('Watcher error: ' + error);
      });

      this.on('load', (name, source) => {
        this.watcher.add(source.path);
      });
    }
  }

  getSource(name) {
    // Don't allow file-system traversal
    if ((/^\.?\.?(\/|\\)/).test(name)) {
      return null;
    }
    if ((/^[A-Z]:/).test(name)) {
      return null;
    }

    let fullpath;

    try {
      fullpath = require.resolve(name);
    } catch (e) {
      return null;
    }

    this.pathsToNames[fullpath] = name;

    const source = {
      src: fs.readFileSync(fullpath, 'utf-8'),
      path: fullpath,
      noCache: this.noCache,
    };

    this.emit('load', name, source);
    return source;
  }
}

module.exports = {
  FileSystemLoader: FileSystemLoader,
  PrecompiledLoader: PrecompiledLoader,
  NodeResolveLoader: NodeResolveLoader,
};
