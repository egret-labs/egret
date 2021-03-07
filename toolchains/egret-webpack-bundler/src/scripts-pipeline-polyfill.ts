import * as path from 'path';
import { Compiler, Configuration } from 'webpack';
export function scriptsPipelinePolyfill(compiler: Compiler, webpackConfig: Configuration, emitter: (p: string, c: Buffer) => void) {
    compiler.options.output.compareBeforeEmit = false;
    compiler.outputFileSystem = {

        writeFile: (
            filepath: string,
            content: string | Buffer,
            callback: (err?: NodeJS.ErrnoException) => void
        ) => {
            const relativePath = path.relative(webpackConfig.output?.path!, filepath).split('\\').join('/');
            emitter!(relativePath, content as Buffer);
            callback();
        },
        mkdir: (dirpath: string, callback: (arg0?: NodeJS.ErrnoException) => void) => {
            callback();
        },
        stat: (
            filepath: string,
            callback: (err?: NodeJS.ErrnoException, stats?: any) => void
        ) => {
            callback();
        },
        readFile: (
            filepath: string,
            callback: (err?: NodeJS.ErrnoException, content?: string | Buffer) => void
        ) => {

        }
    };
}