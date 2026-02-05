import path from "node:path";
import fs from 'node:fs'
import type { Callback, GlobalOpts, LexResponse, Lexer } from "./types";
import { FileSystemLoader, type Loader } from "./loader";
import { lex_init } from "./lexer";
import { _eval, fns } from "./eval";
import { p, randomId, spanInner } from "./lib";
import { compileTemplate } from "./render";

interface IConfigureOptions {
  path?: string;
  dev?: boolean;
	watch?: boolean;
	devRefresh?: boolean; // Only works with HTML or NJK
  detectExtensions?: boolean; // If the file path includes .php / .yaml etc
  loader: Loader;
  _lexer?: Partial<Lexer>;
  ext?: string;
}

const initConfigureOptions: IConfigureOptions = {
  path: "views",
  dev: true,
  loader: FileSystemLoader,
  ext: ".njk",
};



const importDevscript = (options: IConfigureOptions): string => 
  options.dev && options.devRefresh
    ? `<script>
        (function () {
          try {
            var es = new EventSource("/__njk_events");
            es.addEventListener("refresh", function () {
              window.location.reload();
            });
          } catch (e) {}
        })();
      </script>`
    : "";


const EXT_HEADERS: Record<
  string,
  { contentType: string; isText?: boolean }
> = {
  ".html": { contentType: "text/html; charset=utf-8" },
  ".njk":  { contentType: "text/html; charset=utf-8" },

  ".txt":  { contentType: "text/plain; charset=utf-8", isText: true },
  ".yaml": { contentType: "text/yaml; charset=utf-8", isText: true },
  ".yml":  { contentType: "text/yaml; charset=utf-8", isText: true },
  ".json": { contentType: "application/json; charset=utf-8", isText: true },
  ".xml":  { contentType: "application/xml; charset=utf-8", isText: true },

  ".js":   { contentType: "application/javascript; charset=utf-8", isText: true },
  ".css":  { contentType: "text/css; charset=utf-8", isText: true },
};

const applyHeadersForTemplate = (res: any, filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  const rule = EXT_HEADERS[ext];
  if (!rule) return { isText: false };
  res.setHeader("Content-Type", rule.contentType);
  return { isText: !!rule.isText };
};

export function configure(opts: Partial<IConfigureOptions> = {}) {
  const options: IConfigureOptions = { ...initConfigureOptions, ...opts };
	const id = randomId()
	let devVersion = 0;

	const bump = () => {
		devVersion++;
		p.debug("dev refresh bump", devVersion);
	};

  const lex = lex_init({ _lexer: options._lexer }).lex;
  const _loader = options.loader(options.path);

  const _opts: GlobalOpts = {
    loader: _loader,
    lex,
    lexer: {} as LexResponse,
    files: {},
    ctx: {},
    vars: {},
    fns: {} as any,
  };

  _opts.fns = fns(_opts);

	if (options.dev && options.watch) {
		const watchDir = path.resolve(options.path ?? "views");
		try {
			fs.watch(watchDir, { recursive: true }, (_event, filename) => {
				if (!filename) return;
				// if (/\.(njk|html|nunjucks)$/i.test(filename)) 
        bump();
			});
			p.debug("watching", watchDir);
		} catch (e) {
			p.warn("fs.watch recursive not supported here; falling back to non-recursive");
			fs.watch(watchDir, () => bump());
		}
	}

	const devScript = importDevscript(options)
  function express(app: any) {
		if (options.dev && options.devRefresh) {
			app.get("/__njk_events", (req: any, res: any) => {
				res.setHeader("Content-Type", "text/event-stream");
				res.setHeader("Cache-Control", "no-cache");
				res.setHeader("Connection", "keep-alive");
				res.flushHeaders?.();

				let last = devVersion;

				const timer = setInterval(() => {
					if (devVersion !== last) {
						last = devVersion;
						res.write(`event: refresh\ndata: ${last}\n\n`);
					} else {
						res.write(`event: ping\ndata: ${Date.now()}\n\n`);
					}
				}, 500);

				req.on("close", () => clearInterval(timer));
			});
		}
    function View(this: any, _name: string) {
      this.name = _name;
      this.path = _name;

      const ext = path.extname(_name);
      this.ext = ext || options.ext || ".njk";

      if (!ext) this.name = _name + this.ext;
    }

    function renderTemp(name: string, ctx: any, cb: Callback) {
      try {
        const out = compileTemplate(name, ctx, _opts);  
        const ext = path.extname(name).toLowerCase();
        if(ext === '.njk' || ext === '.html') cb(null, devScript + out); //Only works on html
        else  cb(null, out)
      } catch (e: any) {
        cb(e?.message ?? String(e));
      }
    }

    View.prototype.render = function render(this: any, ctx: any, cb: Callback) {

      if(opts.detectExtensions) {
        const res =  ctx?._locals?.res
        if(res) applyHeadersForTemplate(res, this.name)
      }
      renderTemp(this.name, ctx, cb);
    };

    app.use((req, res, next) => {
      res.locals.res = res;
      next();
    });

    app.set("view", View);
    app.set("nunjucksEnv", () => {});
  }

  return { express, id };
}

export const reset = configure;
