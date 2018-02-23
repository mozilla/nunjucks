(function() {
  'use strict';

  var expect,
    nunjucks,
    fs,
    os,
    path;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    nunjucks = require('../nunjucks/index');
    fs = require('fs-extra');
    path = require('path');
    os = require('os');
  } else {
    expect = window.expect;
    nunjucks = window.nunjucks;
  }

  function rmdir(dirPath) {
    fs.emptyDirSync(dirPath);
    fs.rmdir(dirPath);
  }

  describe('nunjucks.configure', function() {
    var tempdir;

    before(function() {
      if (fs && path && os) {
        try {
          tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'templates'));
          fs.emptyDirSync(tempdir);
        } catch (e) {
          rmdir(tempdir);
          throw e;
        }
      }
    });

    after(function() {
      nunjucks.reset();
      if (typeof tempdir !== 'undefined') {
        rmdir(tempdir);
      }
    });

    it('should cache templates by default', function() {
      if (typeof fs === 'undefined') {
        this.skip();
        return;
      }
      nunjucks.configure(tempdir);

      fs.writeFileSync(tempdir + '/test.html', '{{ name }}', 'utf-8');
      expect(nunjucks.render('test.html', {name: 'foo'})).to.be('foo');

      fs.writeFileSync(tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
      expect(nunjucks.render('test.html', {name: 'foo'})).to.be('foo');
    });

    it('should not cache templates with {noCache: true}', function() {
      if (typeof fs === 'undefined') {
        this.skip();
        return;
      }
      nunjucks.configure(tempdir, {noCache: true});

      fs.writeFileSync(tempdir + '/test.html', '{{ name }}', 'utf-8');
      expect(nunjucks.render('test.html', {name: 'foo'})).to.be('foo');

      fs.writeFileSync(tempdir + '/test.html', '{{ name }}-changed', 'utf-8');
      expect(nunjucks.render('test.html', {name: 'foo'})).to.be('foo-changed');
    });
  });
}());
