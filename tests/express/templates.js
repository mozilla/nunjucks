(function() {
var templates = {};
templates["about.html"] = (function() {
function root(env, context, frame, runtime) {
var output = "";
var parentTemplate = env.getTemplate("base.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
output += context.getBlock("content")(env, context, frame, runtime);
output += "\n\n";
output += context.getBlock("footer")(env, context, frame, runtime);
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
}
function b_content(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "content", b_content, runtime);
output += "\nThis is just the about page\n";
return output;
}
function b_footer(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "footer", b_footer, runtime);
output += "\n";
output += (l_super)();
output += "\nYou really should read this!\n";
return output;
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["base.html"] = (function() {
function root(env, context, frame, runtime) {
var output = "";
output += "<!DOCTYPE html>\n<html>\n  <head>\n    <title>A quick app</title>\n\n    <style>\n      body {\n        background-color: #ccccff;\n      }\n\n      .footer {\n        margin-top: 5em;\n        font-size: .75em;\n      }\n    </style>\n\n    <script src=\"/nunjucks-dev.js\"></script>\n    <!-- <script src=\"/templates.js\"></script> -->\n  </head>\n  <body>\n    ";
output += context.getBlock("content")(env, context, frame, runtime);
output += "\n\n    <div class=\"footer\">\n      ";
output += context.getBlock("footer")(env, context, frame, runtime);
output += "\n    </div>\n  </body>\n</html>\n";
return output;
}
function b_content(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "content", b_content, runtime);
return output;
}
function b_footer(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "footer", b_footer, runtime);
output += "(c) James Long 2012";
return output;
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["index.html"] = (function() {
function root(env, context, frame, runtime) {
var output = "";
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
output += l_x;
output += " is better than ";
output += l_y;
output += "!\n\nAND ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "z"), env.autoesc);
output += "\n";
frame = frame.pop();
return output;
});
context.addExport("foo");
context.setVariable("foo", macro_t_2);
output += "\n\n";
output += context.getBlock("content")(env, context, frame, runtime);
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
}
function b_content(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "content", b_content, runtime);
output += "\nHello, ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "username"), env.autoesc);
output += "! This is just some content\n\n";
output += (runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "foo"), env.autoesc))(1,2,3);
output += "\n\n";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "user"), env.autoesc);
output += "\n";
return output;
}
return {
b_content: b_content,
root: root
};

})();
templates["item-base.html"] = (function() {
function root(env, context, frame, runtime) {
var output = "";
output += "\nEditing item: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"), env.autoesc);
output += "\n\n";
output += context.getBlock("description")(env, context, frame, runtime);
output += "\n";
return output;
}
function b_description(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "description", b_description, runtime);
output += "\nA basic description is: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "desc"), env.autoesc);
output += "\n";
return output;
}
return {
b_description: b_description,
root: root
};

})();
templates["item.html"] = (function() {
function root(env, context, frame, runtime) {
var output = "";
var parentTemplate = env.getTemplate("item-base.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\n\n";
output += context.getBlock("description")(env, context, frame, runtime);
output += "\n";
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
}
function b_description(env, context, frame, runtime) {
var output = "";
var l_super = context.getSuper(env, "description", b_description, runtime);
output += "\nI told you, it's name is ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"), env.autoesc);
output += ".\n\nIt also has the description: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "desc"), env.autoesc);
output += ".\n";
return output;
}
return {
b_description: b_description,
root: root
};

})();
nunjucks.env = new nunjucks.Environment([]);
nunjucks.env.registerPrecompiled(templates);
})()
