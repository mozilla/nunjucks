window.baseTmpl = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["base.html"] = (function() {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<!DOCTYPE html>\n<html>\n  <head>\n    <title>A quick app</title>\n\n    <style>\n      body {\n        background-color: #ccffcc;\n      }\n\n      .footer {\n        margin-top: 5em;\n        font-size: .75em;\n      }\n    </style>\n\n    <script src=\"/js/nunjucks.js\"></script>\n    <script src=\"/js/templates.js\"></script>\n    <script src=\"/js/app.js\"></script>\n  </head>\n  <body>\n    ";
context.getBlock("content")(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\n\n    <div class=\"footer\">\n      ";
context.getBlock("footer")(env, context, frame, runtime, function(t_4,t_3) {
if(t_4) { cb(t_4); return; }
output += t_3;
output += "\n    </div>\n  </body>\n</html>\n";
cb(null, output);
})});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_content(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_footer(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "(c) James Long 2012";
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};
})();
return function(ctx, cb) { return nunjucks.render("base.html", ctx, cb); }})();
window.aboutTmpl = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["about.html"] = (function() {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
env.getTemplate("base.html", true, function(t_2,parentTemplate) {
if(t_2) { cb(t_2); return; }
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
output += "\n\n";
output += "\n";
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_content(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "\nThis is just the about page\n";
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_footer(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
context.getSuper(env, "footer", b_footer, frame, runtime, function(t_3,hole_3) {
if(t_3) { cb(t_3); return; }
hole_3 = runtime.markSafe(hole_3);
output += "\n";
output += runtime.suppressValue(hole_3, env.autoesc);
output += "\nYou really should read this!\n\n";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "poop"), env.autoesc);
output += "\n";
cb(null, output);
});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};
})();
return function(ctx, cb) { return nunjucks.render("about.html", ctx, cb); }})();
