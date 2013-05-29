(function() {
var templates = {};
templates["about.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("base.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
output += "\n\n";
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_content(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "content", b_content, frame, runtime);
output += "\nThis is just the about page\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_footer(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "footer", b_footer, frame, runtime);
output += "\n";
output += runtime.suppressValue((lineno = 7, colno = 6, runtime.callWrap(l_super, "super", [])), env.autoesc);
output += "\nYou really should read this!\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["base.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<!DOCTYPE html>\n<html>\n  <head>\n    <title>A quick app</title>\n\n    <style>\n      body {\n        background-color: #ccccff;\n      }\n\n      .footer {\n        margin-top: 5em;\n        font-size: .75em;\n      }\n    </style>\n\n    <script src=\"require.js\" data-main=\"app.js\"></script>\n    <!-- <script src=\"/nunjucks-dev.js\"></script> -->\n    <!-- <script src=\"/templates.js\"></script> -->\n  </head>\n  <body>\n    ";
output += context.getBlock("content")(env, context, frame, runtime);
output += "\n\n    <div class=\"footer\">\n      ";
output += context.getBlock("footer")(env, context, frame, runtime);
output += "\n    </div>\n  </body>\n</html>\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_content(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "content", b_content, frame, runtime);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_footer(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "footer", b_footer, frame, runtime);
output += "(c) James Long 2012";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["index.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("base.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
var macro_t_2 = runtime.makeMacro(
["x", "y"], 
["z"], 
function (l_x, l_y, kwargs) {
frame = frame.push();
kwargs = kwargs || {};
frame.set("x", l_x);
frame.set("y", l_y);
frame.set("z", kwargs.hasOwnProperty("z") ? kwargs["z"] : 10);
var output= "";
output += "\n";
output += runtime.suppressValue(l_x, env.autoesc);
output += " is better than ";
output += runtime.suppressValue(l_y, env.autoesc);
output += "!\n\nAND ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "z"), env.autoesc);
output += "\n";
frame = frame.pop();
return new runtime.SafeString(output);
});
context.addExport("foo");
context.setVariable("foo", macro_t_2);
output += "\n\n";
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_content(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "content", b_content, frame, runtime);
output += "\nHello, ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "username"), env.autoesc);
output += "! This is just some content\n\n";
output += runtime.suppressValue((lineno = 11, colno = 4, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "foo"), "foo", [1,2,3])), env.autoesc);
output += "\n\n";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "user"), env.autoesc);
output += "\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_content: b_content,
root: root
};

})();
templates["item-base.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "\nEditing item: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"), env.autoesc);
output += "\n\n";
output += context.getBlock("description")(env, context, frame, runtime);
output += "\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_description(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "description", b_description, frame, runtime);
output += "\nA basic description is: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "desc"), env.autoesc);
output += "\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_description: b_description,
root: root
};

})();
templates["item.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("item-base.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_description(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "description", b_description, frame, runtime);
output += "\nI told you, it's name is ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"), env.autoesc);
output += ".\n\nIt also has the description: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "desc"), env.autoesc);
output += ".\n";
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_description: b_description,
root: root
};

})();
if(typeof define === "function" && define.amd) {
    define(["nunjucks"], function(nunjucks) {
        nunjucks.env = new nunjucks.Environment([], null);
        nunjucks.env.registerPrecompiled(templates);
        return nunjucks;
    });
}
else if(typeof nunjucks === "object") {
    nunjucks.env = new nunjucks.Environment([], null);
    nunjucks.env.registerPrecompiled(templates);
}
else {
    console.error("ERROR: You must load nunjucks before the precompiled templates");
}
})();
