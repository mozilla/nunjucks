declare module nunjucks {
  module runtime {
    class Frame {
      constructor(parent: any);
    }

    class SafeString {
      constructor(str: string);
    }

    function asyncAll(arr: any, dimen: number, iter: Function, cb: Function);
    function asyncEach(arr: any, dimen: number, iter: Function, cb: Function);
    function contextOrFrameLookup();
    function callWrap(obj: Function, name: string, args: any[]);
    function copySafeness(dest: any, target: any): SafeString;
    function handleError(error: any, lineno?: number, colno?: number): TemplateError;
    function isArray(obj: any): boolean;
    function keys(obj: any): string[];
    function makeKeywordArgs(obj: any): any;
    function makeMacro(argNames, kwargNames, func): Function;
    function markSafe(val: any): Function;
    function memberLookup(obj: any, val: string);
    function numArgs(args: any[]): number;
    function suppressValue(val: string, autoescape: boolean);
  }

  interface EnvironmentOptions {
    autoescape: boolean;
    express: any;
    tags: any;
    watch: boolean;
  }

  interface Extension {
    tags: string[];
    parse(parser: Parser, nodes: any, lexer: any);
  }

  interface Filter { }

  interface Parser {
    parseSignature(throwErrors?: boolean, noParens?: boolean);
    parseUntilBlocks(names: string[]): string;
  }

  class Environment {
    constructor(loaders?: Loader[], EnvironmentOptions?: any);

    render(name: string, context?: any, callback?: Function): string;
    render(str: string, context: any, callback?: Function): string;

    addFilter(name: string, func: Function, async?: Boolean);
    getFilter(name: string): Filter;

    addExtension(name: string, extension: Extension);
    getExtension(name: string): Extension;

    getTemplate(name: string, eagerCompile?: Boolean, callback?: Function): Template;

    express(app: any);
  }

  class FileSystemLoader extends Loader {
    constructor(searchPaths?: string[], noWatch?: boolean);
    constructor(searchPath: string, noWatch?: boolean);
  }

  class Loader {
    async: boolean;

    on(name: string, func: Function);
    emit(name: string, ...args: any[]);

    init();
    getSource(name: string, callback?: Function): any;
  }

  class Template {
    constructor(src: string, env?: Environment, path?: string, eagerCompile?: boolean);
    render(context: any, callback?: Function);
  }

  class TemplateError {
    constructor(messageOrError: any, lineno: number, colno: number);
  }

  class WebLoader extends Loader {
    constructor(baseUrl?: string, neverUpdate?: boolean);
  }

  function render(name: string, context?: any, callback?: Function): string;
  function render(str: string, context: any, callback?: Function): string;

  function configure(path?: string, options?: any): Environment;

  function precompile(path: string, options?: any);
  function precompileString(str: string, options?: any);
}

declare module 'nunjucks' {
  export = nunjucks;
}