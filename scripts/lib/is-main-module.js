module.exports = function isMainModule() {
  // generate a stack trace
  var stack = (new Error()).stack;
  // the third line refers to our caller
  var stackLine = stack.split('\n')[2];
  // extract the module name from that line
  var callerModuleName = /\((.*):\d+:\d+\)$/.exec(stackLine)[1];

  return require.main.filename === callerModuleName;
};
