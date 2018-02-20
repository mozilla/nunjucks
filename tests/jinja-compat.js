(function() {
  'use strict';

  var util;
  var equal;
  var finish;

  if (typeof require !== 'undefined') {
    util = require('./util');
  } else {
    util = window.util;
  }

  equal = util.jinjaEqual;
  finish = util.finish;

  describe('jinja-compat', function() {
    var arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    it('should support array slices with start and stop', function(done) {
      equal('{% for i in arr[1:4] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bcd');
      finish(done);
    });
    it('should support array slices using expressions', function(done) {
      equal('{% for i in arr[n:n+3] %}{{ i }}{% endfor %}',
        {
          n: 1,
          arr: arr
        },
        'bcd');
      finish(done);
    });
    it('should support array slices with start', function(done) {
      equal('{% for i in arr[3:] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'defgh');
      finish(done);
    });
    it('should support array slices with negative start', function(done) {
      equal('{% for i in arr[-3:] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'fgh');
      finish(done);
    });
    it('should support array slices with stop', function(done) {
      equal('{% for i in arr[:4] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'abcd');
      finish(done);
    });
    it('should support array slices with negative stop', function(done) {
      equal('{% for i in arr[:-3] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'abcde');
      finish(done);
    });
    it('should support array slices with step', function(done) {
      equal('{% for i in arr[::2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'aceg');
      finish(done);
    });
    it('should support array slices with negative step', function(done) {
      equal('{% for i in arr[::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'hgfedcba');
      finish(done);
    });
    it('should support array slices with start and negative step', function(done) {
      equal('{% for i in arr[4::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'edcba');
      finish(done);
    });
    it('should support array slices with negative start and negative step', function(done) {
      equal('{% for i in arr[-5::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'dcba');
      finish(done);
    });
    it('should support array slices with stop and negative step', function(done) {
      equal('{% for i in arr[:3:-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'hgfe');
      finish(done);
    });
    it('should support array slices with start and step', function(done) {
      equal('{% for i in arr[1::2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bdfh');
      finish(done);
    });
    it('should support array slices with start, stop, and step', function(done) {
      equal('{% for i in arr[1:7:2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bdf');
      finish(done);
    });
  });
}());
