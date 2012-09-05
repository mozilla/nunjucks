
var e = require('../src/environment');

var env = new e.Environment();

var times = [];
var arr = new Array(1000);
for(var i=0; i<1000; i++) {
    arr[i] = 5;
}

for(var i=0; i<100; i++) {
    env = new e.Environment();
    var t1 = Date.now();
    var tmpl = env.getTemplate('index.html');
    tmpl.render({ username: 'james',
                  arr: arr });
    var t2 = Date.now();
    times.push((t2-t1)/1000);
}

var total = 0;
for(var i=0; i<times.length; i++) {
    total += times[i];
}
console.log(total / times.length);