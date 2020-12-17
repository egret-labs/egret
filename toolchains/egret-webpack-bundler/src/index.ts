import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import webpack from 'webpack';
import { getLibsFileList } from './egretproject';
import { Target_Type } from './egretproject/data';
import SrcLoaderPlugin from './loaders/src-loader/Plugin';
import ThemePlugin from './loaders/theme';
import { emitClassName } from './loaders/ts-loader/ts-transformer';
import { openUrl } from './open';
import * as ts from 'typescript';
import { minifyTransformer } from '@egret/ts-minify-transformer';
const middleware = require("webpack-dev-middleware");
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpackMerge = require('webpack-merge');


export type WebpackBundleOptions = {

    /**
     * 设置发布的库为 library.js 还是 library.min.js
     */
    libraryType: "debug" | "release"

    /**
     * 编译宏常量定义
     */
    defines?: any,

    /**
     * 是否启动 EXML 相关功能
     */
    exml?: {
        /**
         * EXML增量编译
         */
        watch: boolean
    }

    /**
     * TypeScript 相关配置
     */
    typescript?: {
        /**
         * 编译模式
         * modern 模式为完全ES6 Module的方式，底层实现采用 ts-loader
         * legacy 模式为兼容现有代码的方式，底层在执行 ts-loader 之前先进行了其他内部处理
         */
        mode: "legacy" | "modern",

        /**
         * 编译采用的 tsconfig.json 路径，默认为 tsconfig.json
         */
        tsconfigPath?: string

        // minify?: import("@egret/ts-minify-transformer").TransformOptions

    }

    html?: {
        templateFilePath: string
    }

    /**
     * 是否发布子包及子包规则
     */
    subpackages?: { name: string, matcher: (filepath: string) => boolean }[],

    /**
     * 自定义的 webpack 配置
     */
    webpackConfig?: webpack.Configuration | ((bundleWebpackConfig: webpack.Configuration) => webpack.Configuration)
}

export type WebpackDevServerOptions = {
    /**
     * 启动端口，默认值为3000
     */
    port?: number

    /**
     * 编译完成后打开浏览器
     */
    open?: boolean
}


export class EgretWebpackBundler {

    emitter: ((filename: string, data: Buffer) => void) | null = null;

    constructor(private projectRoot: string, private target: string) {

    }


    startDevServer(options: WebpackBundleOptions & WebpackDevServerOptions) {
        const libraryType = 'debug';
        const scripts = getLibsFileList('web', this.projectRoot, libraryType)
        const webpackStatsOptions = { colors: true, modules: false };
        const webpackConfig = generateConfig(this.projectRoot, options, this.target, true)
        const compiler = webpack(webpackConfig);
        const compilerApp = express();
        compilerApp.use(allowCrossDomain);
        const middlewareOptions: any = {
            stats: webpackStatsOptions,
            publicPath: undefined,
        };
        compilerApp.use(middleware(compiler, middlewareOptions));
        const port = options.port || 3000;
        startExpressServer(compilerApp, port);
        compilerApp.use(express.static(this.projectRoot));
        const manifestContent = JSON.stringify(
            { initial: scripts, game: ['main.js'] }, null, '\t'
        )
        fs.writeFileSync(path.join(this.projectRoot, 'manifest.json'), manifestContent, 'utf-8');
        if (options.open) {
            openUrl(`http://localhost:${port}/index.html`);
        }
    }

    build(options: WebpackBundleOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const webpackStatsOptions = { colors: true, modules: false };
            const scripts = getLibsFileList(this.target as Target_Type, this.projectRoot, options.libraryType);
            const webpackConfig = generateConfig(this.projectRoot, options, this.target, false);

            const handler: webpack.Compiler.Handler = (error, status) => {
                console.log(status.toString(webpackStatsOptions));
                resolve();
            };
            const compiler = webpack(webpackConfig);

            if (this.emitter) {

                for (let script of scripts) {
                    const content = fs.readFileSync(path.join(this.projectRoot, script));
                    this.emitter(script, content);
                }


                compiler.outputFileSystem = {

                    mkdir: (path: string, callback: (err: Error | undefined | null) => void) => {
                        callback(null);
                    },
                    mkdirp: (path: string, callback: (err: Error | undefined | null) => void) => {
                        callback(null);
                    },

                    rmdir: (path: string, callback: (err: Error | undefined | null) => void) => {
                        callback(null)
                    },

                    unlink: (path: string, callback: (err: Error | undefined | null) => void) => {
                        callback(null)
                    },
                    join: path.join,

                    writeFile: (p: string, data: any, callback: (err: Error | undefined | null) => void) => {
                        const relativePath = path.relative(webpackConfig.output?.path!, p).split("\\").join("/");
                        this.emitter!(relativePath, data)
                        callback(null)
                    }
                }
            }
            compiler.run(handler)
        })

    }
}

export function generateConfig(
    context: string,
    options: WebpackBundleOptions,
    target: string,
    devServer: boolean

): webpack.Configuration {

    context = context.split("/").join(path.sep);
    const needSourceMap = devServer;
    const mode = devServer ? "development" : "production";

    let config: webpack.Configuration = {
        stats: "minimal",
        entry: './src/Main.ts',
        target: 'web',
        mode,
        context,
        devtool: needSourceMap ? "source-map" : false,
        output: {
            path: path.resolve(context, 'dist'),
            filename: 'main.js'
        },
        module: {
            rules: []
        },
        resolve: {
            extensions: [".ts", ".js"]
        },
        optimization: {
            minimize: false,
        },
        plugins: []
    };
    generateWebpackConfig_typescript(config, options, needSourceMap);
    generateWebpackConfig_exml(config, options);
    generateWebpackConfig_html(config, options, target);
    genrateWebpackConfig_subpackages(config, options);
    if (target === 'lib') {
        config.output!.library = 'xxx';
        config.output!.libraryTarget = 'umd';
    }
    if (options.libraryType === 'debug') {
        config.plugins!.push(new webpack.NamedModulesPlugin());
        config.plugins!.push(new webpack.NamedChunksPlugin());
    }
    if (options.webpackConfig) {
        const customWebpackConfig = typeof options.webpackConfig === 'function' ? options.webpackConfig(config) : options.webpackConfig;
        config = webpackMerge(config, customWebpackConfig);
    }
    return config;
}

function genrateWebpackConfig_subpackages(config: webpack.Configuration, options: WebpackBundleOptions) {
    if (!options.subpackages) {
        return config;
    }
    const items = options.subpackages.map(subpackage => {
        return {
            name: subpackage.name,
            filename: subpackage.name + ".js",
            test: (module: any) => {
                return subpackage.matcher(module.resource)
            },
            chunks: "initial",
            minSize: 0,
        }
    })

    config.optimization = {
        splitChunks: {
            cacheGroups: {
                default: false
            }
        }
    }
    for (let item of items) {
        (config.optimization.splitChunks as any).cacheGroups[item.name] = item;
    }
    return config;
}

function generateWebpackConfig_typescript(config: webpack.Configuration, options: WebpackBundleOptions, needSourceMap: boolean) {


    const compilerOptions: import("typescript").CompilerOptions = {
        sourceMap: needSourceMap,
        importHelpers: false,
        noEmitHelpers: true
    };
    const rules = config.module!.rules!;
    const plugins = config.plugins!;

    const srcLoaderRule: webpack.RuleSetRule = {
        test: /\.tsx?$/,
        include: path.join(config.context!, 'src'),
        loader: require.resolve('./loaders/src-loader'),
    };


    const typescriptLoaderRule: webpack.RuleSetRule = {
        test: /\.tsx?$/,
        loader: require.resolve('ts-loader'),
        options: {
            transpileOnly: false,
            configFile: options.typescript?.tsconfigPath || 'tsconfig.json',
            compilerOptions,
            getCustomTransformers: function (program: ts.Program) {
                return {
                    before: [
                        emitClassName(),
                    ]
                };
                // if (options.typescript?.minify) {
                //     return ({
                //         before: [
                //             emitClassName(),
                //             minifyTransformer(program, options.typescript.minify)
                //         ]
                //     });
                // }
                // else {
                //     return ({
                //         before: [
                //             emitClassName(),
                //         ]
                //     });
                // }

            }
        }
    }

    if (options.typescript?.mode === 'modern') {
        plugins.push(new ForkTsCheckerPlugin());
        (typescriptLoaderRule.options as any).transpileOnly = true;
        rules.push(typescriptLoaderRule);
    }
    else {
        rules.push(srcLoaderRule);
        plugins.push(new SrcLoaderPlugin());
        rules.push(typescriptLoaderRule);
    }
    plugins.push(new webpack.BannerPlugin({ banner: polyfill, raw: true }))
}


function generateWebpackConfig_exml(config: webpack.Configuration, options: WebpackBundleOptions) {

    if (!options.exml) {
        return;
    }
    const exmlLoaderRule: webpack.RuleSetRule = {
        test: /\.exml/,
        use: [
            // {
            //     loader: 'thread-loader',
            //     options: {
            //         workers: 2,
            //     },
            // },
            require.resolve("./loaders/exml"),
        ],
    };

    if (options.exml?.watch) {
        // rules.push(srcLoaderRule);
        config.module!.rules.push(exmlLoaderRule);
        config.plugins!.push(new ThemePlugin({}))
        config.watchOptions = {
            ignored: /exml.e.d.ts/
        }
    }
}

function generateWebpackConfig_html(config: webpack.Configuration, options: WebpackBundleOptions, target: string) {
    if (!options.html) {
        return;
    }
    if (['web', 'ios', 'android'].indexOf(target) >= 0) {
        config.plugins?.push(
            new HtmlWebpackPlugin({
                inject: false,
                template: options.html.templateFilePath
            }))
    }
}



function allowCrossDomain(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
}

function startExpressServer(compilerApp: express.Express, port: number) {
    return new Promise((resolve, reject) => {
        compilerApp
            .listen(port, () => {
                resolve();
            })
            .on("error", () => {
                reject();
            });
    });
}


const polyfill = `

var extendStatics = Object.setPrototypeOf ||
({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

var __extends = function (d, b) {
extendStatics(d, b);
function __() { this.constructor = d; }
d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var __assign = Object.assign || function (t) {
for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
}
return t;
};

var __rest = function (s, e) {
var t = {};
for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
    }
return t;
};

var __decorate = function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __param = function (paramIndex, decorator) {
return function (target, key) { decorator(target, key, paramIndex); }
};

var __metadata = function (metadataKey, metadataValue) {
if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
};

var __awaiter = function (thisArg, _arguments, P, generator) {
function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
});
};

var __generator = function (thisArg, body) {
var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
function verb(n) { return function (v) { return step([n, v]); }; }
function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
            case 0: case 1: t = op; break;
            case 4: _.label++; return { value: op[1], done: false };
            case 5: _.label++; y = op[1]; op = [0]; continue;
            case 7: op = _.ops.pop(); _.trys.pop(); continue;
            default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                if (t[2]) _.ops.pop();
                _.trys.pop(); continue;
        }
        op = body.call(thisArg, _);
    } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
}
};

var __exportStar = function(m, exports) {
for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};

var __createBinding = Object.create ? (function(o, m, k, k2) {
if (k2 === undefined) k2 = k;
Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
if (k2 === undefined) k2 = k;
o[k2] = m[k];
});

var __values = function (o) {
var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
if (m) return m.call(o);
if (o && typeof o.length === "number") return {
    next: function () {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
    }
};
throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __read = function (o, n) {
var m = typeof Symbol === "function" && o[Symbol.iterator];
if (!m) return o;
var i = m.call(o), r, ar = [], e;
try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
}
catch (error) { e = { error: error }; }
finally {
    try {
        if (r && !r.done && (m = i["return"])) m.call(i);
    }
    finally { if (e) throw e.error; }
}
return ar;
};

var __spread = function () {
for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read(arguments[i]));
return ar;
};

var __spreadArrays = function () {
for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
return r;
};

var __await = function (v) {
return this instanceof __await ? (this.v = v, this) : new __await(v);
};

var __asyncGenerator = function (thisArg, _arguments, generator) {
if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
var g = generator.apply(thisArg, _arguments || []), i, q = [];
return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
function fulfill(value) { resume("next", value); }
function reject(value) { resume("throw", value); }
function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};

var __asyncDelegator = function (o) {
var i, p;
return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};

var __asyncValues = function (o) {
if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
var m = o[Symbol.asyncIterator], i;
return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};

var __makeTemplateObject = function (cooked, raw) {
if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
o["default"] = v;
};

var __importStar = function (mod) {
if (mod && mod.__esModule) return mod;
var result = {};
if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
__setModuleDefault(result, mod);
return result;
};

var __importDefault = function (mod) {
return (mod && mod.__esModule) ? mod : { "default": mod };
};

var __classPrivateFieldGet = function (receiver, privateMap) {
if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
}
return privateMap.get(receiver);
};

var __classPrivateFieldSet = function (receiver, privateMap, value) {
if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to set private field on non-instance");
}
privateMap.set(receiver, value);
return value;
};

var __reflect = function(p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
`