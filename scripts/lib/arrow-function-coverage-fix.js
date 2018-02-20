// Restore old babylon behavior for istanbul.
// https://github.com/babel/babel/pull/6836
// https://github.com/istanbuljs/istanbuljs/issues/119
module.exports = function hacks() {
  return {
    visitor: {
      Program: function Program(programPath) {
        programPath.traverse({
          ArrowFunctionExpression: function ArrowFunctionExpression(path) {
            var node = path.node;
            node.expression = node.body.type !== 'BlockStatement';
          },
        });
      },
    },
  };
};
