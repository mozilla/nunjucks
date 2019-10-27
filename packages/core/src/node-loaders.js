/* eslint-disable no-console */

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {Loader} from './loader';
export {PrecompiledLoader} from './precompiled-loader';

let chokidar;

// class WatchLoader extends Loader {
//   constructor(opts, searchPaths = []) {
//     this.opts = opts = opts || {};
//     this.watcher = null;
//     this.pendingWatch = [];
//
//     if (this.opts.watch) {
//       this.pendingWatch = searchPaths.filter(fs.existsSync);
//       // Watch all the templates in the paths and fire an event when
//       // they change
//
//       this.on('load', (name, source) => {
//         if (this.watcher) {
//           this.watcher.add(source.path);
//         } else {
//           this.pendingWatch.push(source.path);
//         }
//       });
//
//       import('chokidar').then((mod) => {
//         chokidar = mod;
//         this.watcher = chokidar.watch(this.pendingWatch);
//         this.watcher.on('all', (event, fullname) => {
//           fullname = path.resolve(fullname);
//           if (event === 'change' && fullname in this.pathsToNames) {
//             this.emit('update', this.pathsToNames[fullname], fullname);
//           }
//         });
//         this.watcher.on('error', (error) => {
//           console.log('Watcher error: ' + error);
//         });
//       }, (err) => throw new Error('watch requires chokidar to be installed'));
//     }
//   }
//
//   watch(sourcePath) {
//     if (this.watcher) {
//       this.watcher.add(sourcePath)
//     } else {
//       this.pendingWatch.push(sourcePath);
//     }
//   }
// }

export class FileSystemLoader extends Loader {
  constructor(searchPaths, opts) {
    super();

    if (typeof opts === 'boolean') {
      console.log(
        '[nunjucks] Warning: you passed a boolean as the second ' +
        'argument to FileSystemLoader, but it now takes an options ' +
        'object. See http://mozilla.github.io/nunjucks/api.html#filesystemloader'
      );
      opts = {};
    }
    opts = opts || {};

    if (Array.isArray(searchPaths) || searchPaths) {
      searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];
      // For windows, convert to forward slashes
      searchPaths = searchPaths.map(path.normalize);
    } else {
      searchPaths = ['.'];
    }

    this.searchPaths = searchPaths;
    this.pathsToNames = {};
    this.noCache = !!opts.noCache;

    if (opts.watch) {
      this.pendingWatch = searchPaths.filter(fs.existsSync);
      // Watch all the templates in the paths and fire an event when
      // they change

      this.on('load', (name, source) => {
        if (this.watcher) {
          this.watcher.add(source.path);
        } else {
          this.pendingWatch.push(source.path);
        }
      });

      import('chokidar').then((mod) => {
        chokidar = mod;
        this.watcher = chokidar.watch(this.pendingWatch);
        this.watcher.on('change', (fullname) => {
          fullname = path.resolve(fullname);
          this.emit('update', this.pathsToNames[fullname], fullname);
        });
        this.watcher.on('error', (error) => {
          console.log('Watcher error: ' + error);
        });
      }, (err) => {
        throw new Error('watch requires chokidar to be installed');
      });
    }
  }

  resolve(from, to) {
    return path.resolve(path.dirname(from), to);
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

export class NodeResolveLoader extends FileSystemLoader {
  constructor(opts) {
    opts = opts || {};
    super([], opts);
    // this.pathsToNames = {};
    // this.noCache = !!opts.noCache;
    //
    // if (opts.watch) {
    //   if (!chokidar) {
    //     throw new Error('watch requires chokidar to be installed');
    //   }
    //   this.watcher = chokidar.watch();
    //
    //   this.watcher.on('change', (fullname) => {
    //     this.emit('update', this.pathsToNames[fullname], fullname);
    //   });
    //   this.watcher.on('error', (error) => {
    //     console.log('Watcher error: ' + error);
    //   });
    //
    //   this.on('load', (name, source) => {
    //     this.watcher.add(source.path);
    //   });
    // }
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

export const WebLoader = undefined;

export default {
  FileSystemLoader,
  NodeResolveLoader,
};
