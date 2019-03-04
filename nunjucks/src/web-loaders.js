'use strict';

const Loader = require('./loader');
const {PrecompiledLoader} = require('./precompiled-loader.js');

class WebLoader extends Loader {
  constructor(baseURL, opts) {
    super();
    this.baseURL = baseURL || '.';
    opts = opts || {};

    // By default, the cache is turned off because there's no way
    // to "watch" templates over HTTP, so they are re-downloaded
    // and compiled each time. (Remember, PRECOMPILE YOUR
    // TEMPLATES in production!)
    this.useCache = !!opts.useCache;

    // We default `async` to false so that the simple synchronous
    // API can be used when you aren't doing anything async in
    // your templates (which is most of the time). This performs a
    // sync ajax request, but that's ok because it should *only*
    // happen in development. PRECOMPILE YOUR TEMPLATES.
    this.async = !!opts.async;
  }

  resolve(from, to) {
    throw new Error('relative templates not support in the browser yet');
  }

  getSource(name, cb) {
    var useCache = this.useCache;
    var result;
    this.fetch(this.baseURL + '/' + name, (err, src) => {
      if (err) {
        if (cb) {
          cb(err.content);
        } else if (err.status === 404) {
          result = null;
        } else {
          throw err.content;
        }
      } else {
        result = {
          src: src,
          path: name,
          noCache: !useCache
        };
        this.emit('load', name, result);
        if (cb) {
          cb(null, result);
        }
      }
    });

    // if this WebLoader isn't running asynchronously, the
    // fetch above would actually run sync and we'll have a
    // result here
    return result;
  }

  fetch(url, cb) {
    // Only in the browser please
    if (typeof window === 'undefined') {
      throw new Error('WebLoader can only by used in a browser');
    }

    const ajax = new XMLHttpRequest();
    let loading = true;

    ajax.onreadystatechange = () => {
      if (ajax.readyState === 4 && loading) {
        loading = false;
        if (ajax.status === 0 || ajax.status === 200) {
          cb(null, ajax.responseText);
        } else {
          cb({
            status: ajax.status,
            content: ajax.responseText
          });
        }
      }
    };

    url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
    (new Date().getTime());

    ajax.open('GET', url, this.async);
    ajax.send();
  }
}

module.exports = {
  WebLoader: WebLoader,
  PrecompiledLoader: PrecompiledLoader
};
