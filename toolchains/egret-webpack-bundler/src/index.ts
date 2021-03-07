
import express from 'express';
import * as path from 'path';
import webpack from 'webpack';
import { createFileSystem } from './assets/utils';
import { generateConfig } from './generateConfig';
import { openUrl } from './open';
import { WebpackBundleOptions } from './options/typings';
import { scriptsPipelinePolyfill } from './scripts-pipeline-polyfill';

const middleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
export { generateConfig } from './generateConfig';
export { WebpackBundleOptions } from './options/typings';

// export type WebpackBundleOptions = {

//     /**
//      * 设置发布的库为 library.js 还是 library.min.js
//      */
//     libraryType: 'debug' | 'release'

//     /**
//      * 编译宏常量定义
//      */
//     defines?: {
//         [key: string]: string | number | boolean
//     },

//     /**
//      * 是否启动 EXML 相关功能
//      */
//     exml?: {
//         /**
//          * EXML增量编译
//          */
//         watch: boolean
//     }

//     /**
//      * TypeScript 相关配置
//      */
//     typescript?: {
//         /**
//          * 编译模式
//          * modern 模式为完全ES6 Module的方式，底层实现采用 ts-loader
//          * legacy 模式为兼容现有代码的方式，底层在执行 ts-loader 之前先进行了其他内部处理
//          */
//         mode: 'legacy' | 'modern',

//         /**
//          * 编译采用的 tsconfig.json 路径，默认为 tsconfig.json
//          */
//         tsconfigPath?: string

//         // minify?: import("@egret/ts-minify-transformer").TransformOptions

//     }

//     html?: {
//         templateFilePath: string
//     }

//     /**
//      * 是否发布子包及子包规则
//      */
//     subpackages?: { name: string, matcher: (filepath: string) => boolean }[],

//     /**
//      * 自定义的 webpack 配置
//      */
//     webpackConfig?: webpack.Configuration | ((bundleWebpackConfig: webpack.Configuration) => webpack.Configuration)

//     parseEgretProperty?: boolean

//     assets?: ResourceConfigFilePluginOptions
// }

// export type WebpackDevServerOptions = {
//     /**
//      * 启动端口，默认值为3000
//      */
//     port?: number

//     /**
//      * 编译完成后打开浏览器
//      */
//     open?: boolean
// }

export class EgretWebpackBundler {

    emitter: ((filename: string, data: Buffer) => void) | null = null;

    // eslint-disable-next-line no-useless-constructor
    constructor(private projectRoot: string, private target: string) {

    }

    startDevServer(options: WebpackBundleOptions) {
        const webpackStatsOptions = { colors: true, modules: false };
        const webpackConfig = generateConfig(this.projectRoot, options, this.target, true);
        const hotMiddlewareScript = require.resolve('webpack-hot-middleware/client') + '?reload=true';
        (webpackConfig.entry! as any).main.unshift(hotMiddlewareScript);
        webpackConfig.plugins?.push(
            // new webpack.optimize.OccurrenceOrderPlugin(false),
            new webpack.HotModuleReplacementPlugin(),
        );
        webpackConfig.optimization!.emitOnErrors = false;

        const compiler = webpack(webpackConfig);
        const compilerApp = express();
        compilerApp.use(allowCrossDomain);
        const middlewareOptions: any = {
            stats: webpackStatsOptions,
            publicPath: undefined,
            outputFileSystem: createFileSystem(path.join(compiler.context, 'cache_library'))
        };
        compilerApp.use(middleware(compiler, middlewareOptions));
        compilerApp.use(webpackHotMiddleware(compiler));
        const port = options.devServer?.port || 3000;
        startExpressServer(compilerApp, port);
        // compilerApp.use(express.static(this.projectRoot));
        if (options.devServer?.open) {
            openUrl(`http://localhost:${port}/index.html`);
        }
    }

    build(options: WebpackBundleOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const webpackConfig = generateConfig(this.projectRoot, options, this.target, false);
            const handler: Parameters<webpack.Compiler['run']>[0] = (error, status) => {
                if (error) {

                }
                else {
                    console.log(status!.toString(webpackConfig.stats));
                    resolve();
                }
            };
            const compiler = webpack(webpackConfig);

            if (this.emitter) {
                scriptsPipelinePolyfill(compiler, webpackConfig, this.emitter);
            }
            compiler.run(handler);
        });
    }
}

function allowCrossDomain(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
}

function startExpressServer(compilerApp: express.Express, port: number) {
    return new Promise<void>((resolve, reject) => {
        compilerApp
            .listen(port, () => {
                resolve();
            })
            .on('error', () => {
                reject();
            });
    });
}