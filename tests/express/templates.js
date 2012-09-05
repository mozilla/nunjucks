(function() {
var templates = {};
templates["about.html"] = (function() {
function root(env, context) {
var t_1 = "";
var parentTemplate = env.getTemplate("base.html", true);
for(var t_2 in parentTemplate.blocks) {
context.addBlock(t_2, parentTemplate.blocks[t_2]);
}
t_1 += "\n\n";
t_1 += context.getBlock("content")(env, context);
t_1 += "\n\n";
t_1 += context.getBlock("footer")(env, context);
t_1 += "\n";
return parentTemplate.rootRenderFunc(env, context);
}
function b_content(env, context) {
var t_3 = "";
var l_super = context.getSuper(env, "content", b_content);
t_3 += "\nThis is just the about page\n";
return t_3;
}
function b_footer(env, context) {
var t_4 = "";
var l_super = context.getSuper(env, "footer", b_footer);
t_4 += "\n";
t_4 += l_super();
t_4 += "\nYou really should read this!\n";
return t_4;
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["base.html"] = (function() {
function root(env, context) {
var t_1 = "";
t_1 += "<!DOCTYPE html>\n<html>\n  <head>\n    <title>A quick app</title>\n\n    <style>\n      body {\n        background-color: #ccccff;\n      }\n\n      .footer {\n        margin-top: 5em;\n        font-size: .75em;\n      }\n    </style>\n\n    <script src=\"/nunjucks.js\"></script>\n  </head>\n  <body>\n    ";
t_1 += context.getBlock("content")(env, context);
t_1 += "\n\n    <div class=\"footer\">\n      ";
t_1 += context.getBlock("footer")(env, context);
t_1 += "\n    </div>\n  </body>\n</html>\n";
return t_1;
}
function b_content(env, context) {
var t_2 = "";
var l_super = context.getSuper(env, "content", b_content);
return t_2;
}
function b_footer(env, context) {
var t_3 = "";
var l_super = context.getSuper(env, "footer", b_footer);
t_3 += "(c) James Long 2012";
return t_3;
}
return {
b_content: b_content,
b_footer: b_footer,
root: root
};

})();
templates["index.html"] = (function() {
function root(env, context) {
var t_1 = "";
var parentTemplate = env.getTemplate("base.html", true);
for(var t_2 in parentTemplate.blocks) {
context.addBlock(t_2, parentTemplate.blocks[t_2]);
}
t_1 += "\n\n";
t_1 += context.getBlock("content")(env, context);
t_1 += "\n\n\n";
return parentTemplate.rootRenderFunc(env, context);
}
function b_content(env, context) {
var t_3 = "";
var l_super = context.getSuper(env, "content", b_content);
t_3 += "\nHello, ";
t_3 += context.lookup("username");
t_3 += "! This is just some content\n";
return t_3;
}
return {
b_content: b_content,
root: root
};

})();
templates["item-base.html"] = (function() {
function root(env, context) {
var t_1 = "";
t_1 += "\nEditing item: ";
t_1 += context.lookup("name");
t_1 += "\n\n";
t_1 += context.getBlock("description")(env, context);
t_1 += "\n";
return t_1;
}
function b_description(env, context) {
var t_2 = "";
var l_super = context.getSuper(env, "description", b_description);
t_2 += "\nA basic description is: ";
t_2 += context.lookup("desc");
t_2 += "\n";
return t_2;
}
return {
b_description: b_description,
root: root
};

})();
templates["item.html"] = (function() {
function root(env, context) {
var t_1 = "";
var parentTemplate = env.getTemplate("item-base.html", true);
for(var t_2 in parentTemplate.blocks) {
context.addBlock(t_2, parentTemplate.blocks[t_2]);
}
t_1 += "\n\n";
t_1 += context.getBlock("description")(env, context);
t_1 += "\n";
return parentTemplate.rootRenderFunc(env, context);
}
function b_description(env, context) {
var t_3 = "";
var l_super = context.getSuper(env, "description", b_description);
t_3 += "\nI told you, it's name is ";
t_3 += context.lookup("name");
t_3 += ".\n\nIt also has the description: ";
t_3 += context.lookup("desc");
t_3 += ".\n";
return t_3;
}
return {
b_description: b_description,
root: root
};

})();
nunjucks.env = new nunjucks.Environment([]);
nunjucks.env.registerPrecompiled(templates);
})()
