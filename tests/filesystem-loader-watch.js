/* global describe, beforeEach, afterEach, it */
/* eslint-disable global-require */
(function() {
  'use strict';

  // FileSystemLoader and Chokidar are Node-only; no browser shim is used.
  if (typeof window !== 'undefined') {
    return;
  }

  const assert = require('assert');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const root = process.env.NUNJUCKS_SOURCE_ROOT || path.resolve(__dirname, '..');
  const loaderPath = path.join(root, 'nunjucks/src/node-loaders.js');
  const FileSystemLoader = require(loaderPath).FileSystemLoader;
  const chokidar = require(require.resolve('chokidar', {
    paths: [path.dirname(loaderPath)]
  }));

  function nextEvent(emitter, event) {
    return new Promise(function(resolve, reject) {
      const timer = setTimeout(function() {
        cleanup();
        reject(new Error('Timed out waiting for ' + event));
      }, 5000);
      function cleanup() {
        clearTimeout(timer);
        emitter.removeListener(event, received);
        emitter.removeListener('error', failed);
      }
      function received(...args) {
        cleanup();
        resolve(args);
      }
      function failed(error) {
        cleanup();
        reject(error);
      }
      emitter.once(event, received);
      emitter.once('error', failed);
    });
  }

  describe('FileSystemLoader watcher lifecycle', function() {
    this.timeout(10000);
    let directory;
    let observed;
    let originalWatch;

    beforeEach(function() {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nunjucks-watch-'));
      fs.writeFileSync(path.join(directory, 'sample.njk'), 'first', 'utf8');
      observed = [];
      originalWatch = chokidar.watch;
      // Observe the real factory only so even a failing baseline can close its
      // otherwise inaccessible watcher. No watcher behavior is simulated.
      chokidar.watch = function(...args) {
        const watcher = originalWatch.apply(this, args);
        observed.push(watcher);
        return watcher;
      };
    });

    afterEach(async function() {
      chokidar.watch = originalWatch;
      try {
        await Promise.all(observed.map(function(watcher) {
          return watcher.close();
        }));
      } finally {
        fs.rmSync(directory, {recursive: true, force: true});
      }
    });

    it('exposes the actual watcher so callers can await shutdown', async function() {
      const loader = new FileSystemLoader(directory, {watch: true});
      assert.strictEqual(observed.length, 1);
      assert.strictEqual(loader.watcher, observed[0]);
      await nextEvent(loader.watcher, 'ready');
      assert.ok(Object.keys(loader.watcher.getWatched()).length > 0);
      await loader.watcher.close();
      assert.deepStrictEqual(loader.watcher.getWatched(), {});
    });

    it('preserves real file loading without allocating a watcher by default', function() {
      const loader = new FileSystemLoader(directory);
      const source = loader.getSource('sample.njk');
      assert.strictEqual(source.src, 'first');
      assert.strictEqual(source.path, path.join(directory, 'sample.njk'));
      assert.strictEqual(source.noCache, false);
      assert.strictEqual(loader.watcher, undefined);
      assert.strictEqual(observed.length, 0);
    });

    it('keeps update events working through the exposed real watcher', async function() {
      const loader = new FileSystemLoader(directory, {watch: true});
      assert.strictEqual(loader.watcher, observed[0]);
      const source = loader.getSource('sample.njk');
      await nextEvent(loader.watcher, 'ready');
      const update = nextEvent(loader, 'update');
      fs.writeFileSync(source.path, 'second', 'utf8');
      const args = await update;
      assert.strictEqual(args[0], 'sample.njk');
      assert.strictEqual(args[1], source.path);
      assert.strictEqual(loader.getSource('sample.njk').src, 'second');
      await loader.watcher.close();
      assert.deepStrictEqual(loader.watcher.getWatched(), {});
    });

    it('keeps watcher ownership independent across loader instances', async function() {
      const first = new FileSystemLoader(directory, {watch: true});
      const second = new FileSystemLoader(directory, {watch: true});
      assert.strictEqual(first.watcher, observed[0]);
      assert.strictEqual(second.watcher, observed[1]);
      assert.notStrictEqual(first.watcher, second.watcher);
      await Promise.all([
        nextEvent(first.watcher, 'ready'),
        nextEvent(second.watcher, 'ready')
      ]);
      await first.watcher.close();
      assert.deepStrictEqual(first.watcher.getWatched(), {});
      assert.ok(Object.keys(second.watcher.getWatched()).length > 0);
      assert.strictEqual(second.getSource('sample.njk').src, 'first');
    });
  });
}());
