var should = require('should');
var render = require('./util').render;

function _iter(variable) {
    return '{% for i in ' + variable + ' %}{{ i }}{% endfor %}';
}

describe('runtime_objects', function() {
    it('get', function() {
        render('{{ obj.get("a") }}', {obj: {a: 1, b: 2}}).should.equal('1');
        render('{{ obj.get("x") }}', {obj: {a: 1, b: 2}}).should.equal('');
        render('{{ obj.get("x",5) }}', {obj: {a: 1, b: 2}}).should.equal('5');
    });

    it('values', function() {
        render(
            _iter('obj.values()'),
            {obj: {a: 1, b: 2}}
        ).should.equal('12');
        render(
            _iter('obj.values()'),
            {obj: {a: 'foo', b: 'bar'}}
        ).should.equal('foobar');
        render(
            _iter('obj.itervalues()'),
            {obj: {a: 1, b: 2}}
        ).should.equal('12');
        render(
            _iter('obj.itervalues()'),
            {obj: {a: 'foo', b: 'bar'}}
        ).should.equal('foobar');
    });

    it('keys', function() {
        render(
            _iter('obj.keys()'),
            {obj: {a: 1, b: 2}}
        ).should.equal('ab');
        render(
            _iter('obj.keys()'),
            {obj: {zip: 'foo', zap: 'bar'}}
        ).should.equal('zipzap');
        render(
            _iter('obj.iterkeys()'),
            {obj: {a: 1, b: 2}}
        ).should.equal('ab');
        render(
            _iter('obj.iterkeys()'),
            {obj: {zip: 'foo', zap: 'bar'}}
        ).should.equal('zipzap');
    });

    it('items', function() {
        var tpl = '{% for x, y in obj.items() %}{{ x }}:{{ y }};{% endfor %}';

        render(tpl, {obj: {a: 1, b: 2}}).should.equal('a:1;b:2;');
        render(tpl, {obj: {zip: 'foo', zap: 'bar'}}).should.equal('zip:foo;zap:bar;');
        render(tpl, {obj: {a: 1, b: 2}}).should.equal('a:1;b:2;');
        render(tpl, {obj: {zip: 'foo', zap: 'bar'}}).should.equal('zip:foo;zap:bar;');
    });

    it('has_key', function() {
        render('{{ "true" if obj.has_key("a") }}', {obj: {a: 1, b: 2}}).should.equal('true');
        render('{{ "true" if obj.has_key("x") }}', {obj: {a: 1, b: 2}}).should.equal('');
    });

    it('pop', function() {
        render('{{ obj.pop("a") }}', {obj: {a: 1, b: 2}}).should.equal('1');
        render('{{ obj.pop("x", "") }}', {obj: {a: 1, b: 2}}).should.equal('');
        render('{{ obj.pop("x", "foo") }}', {obj: {a: 1, b: 2}}).should.equal('foo');
        render(
            '{{ obj.pop("a", "foo") }}{{ obj.pop("a", "foo") }}',
            {obj: {a: 1, b: 2}}
        ).should.equal('1foo');

        (function() {
            render(
                '{{ obj.pop("foo") }}',
                {obj: {a: 1, b: 2}}
            );
        }).should.throw(/KeyError/);
    });

    it('popitem', function() {
        render('{{ obj.popitem()[0] }}', {obj: {a: 1}}).should.equal('a');
        render(
            '{{ obj.popitem()[0] }}{{ obj.get("a", "blank") }}',
            {obj: {a: 1}}
        ).should.equal('ablank');
        render('{{ obj.popitem()[1] }}', {obj: {a: 1}}).should.equal('1');

        (function() {
            render(
                '{{ obj.popitem() }}',
                {obj: {}}
            );
        }).should.throw(/KeyError/);
    });

    it('setdefault', function() {
        render('{{ obj.setdefault("a", "value") }}', {obj: {a: 1}}).should.equal('1');
        render('{{ obj.setdefault("x", "value") }}', {obj: {a: 1}}).should.equal('value');
        render(
            '{{ obj.setdefault("a", "value") }}{{ obj.a }}',
            {obj: {a: 1}}
        ).should.equal('11');
    });

    it('update', function() {
        render('{{ obj.update({x: 123}) }}', {obj: {a: 1}}).should.equal('');
        render('{{ obj.update({x: 123}) }}{{ obj.x }}', {obj: {a: 1}}).should.equal('123');
    });

});

describe('runtime_arrays', function() {
    it('pop', function() {
        render(
            '{{ list.pop() }}' +
            '{{ list.pop() }}' +
            '{{ list.pop() }}',
            {list: [1, 2, 3]}
        ).should.equal('321');
        render(
            '{{ list.pop(0) }}' +
            '{{ list.pop(0) }}' +
            '{{ list.pop(0) }}',
            {list: [1, 2, 3]}
        ).should.equal('123');

        (function() {
            render(
                '{{ list.pop(3) }}',
                {list: [1, 2, 3]}
            );
        }).should.throw(/KeyError/);
    });

    it('remove', function() {
        render(
            '{{ list.remove(2) }}' +
            '{{ list[0] }}' +
            '{{ list[1] }}',
            {list: [1, 2, 3]}
        ).should.equal('213');
        render(
            '{{ list.remove("b") }}' +
            '{{ list[0] }}' +
            '{{ list[1] }}' +
            '{{ list[2] }}',
            {list: ["a", "b", "b", "c"]}
        ).should.equal('babc');

        (function() {
            render(
                '{{ list.remove(4) }}',
                {list: [1, 2, 3]}
            );
        }).should.throw(/ValueError/);
    });

    it('count', function() {
        render(
            '{{ list.count(2) }}',
            {list: [1, 2, 3]}
        ).should.equal('1');
        render(
            '{{ list.count("b") }}',
            {list: ["a", "b", "b", "c"]}
        ).should.equal('2');
        render(
            '{{ list.count("foo") }}',
            {list: ["a", "b", "b", "c"]}
        ).should.equal('0');
    });

    it('index', function() {
        render(
            '{{ list.index(2) }}',
            {list: [1, 2, 3]}
        ).should.equal('1');
        (function() {
            render(
                '{{ list.index(4) }}',
                {list: [1, 2, 3]}
            );
        }).should.throw(/ValueError/);
    });

    it('find', function() {
        render(
            '{{ list.find(2) }}',
            {list: [1, 2, 3]}
        ).should.equal('1');
        render(
            '{{ list.find(4) }}',
            {list: [1, 2, 3]}
        ).should.equal('-1');
    });

    it('insert', function() {
        render(
            '{{ list.insert(0, 999) }}' +
            '{{ list[0] }}' +
            '{{ list[1] }}' +
            '{{ list[2] }}' +
            '{{ list[3] }}',
            {list: [1, 2, 3]}
        ).should.equal('999123');
        render(
            '{{ list.insert(1, 999) }}' +
            '{{ list[0] }}' +
            '{{ list[1] }}' +
            '{{ list[2] }}' +
            '{{ list[3] }}',
            {list: [1, 2, 3]}
        ).should.equal('199923');
    });
});
