
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

    prepare() {


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