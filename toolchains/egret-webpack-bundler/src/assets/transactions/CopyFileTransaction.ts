import { Compilation, Compiler, WebpackError } from "webpack";
import { readFileAsync } from "../../loaders/utils";
import { getAssetsFileSystem } from "../AssetsFileSystem";
import { Transaction } from "../Transaction";


export class CopyFileTransaction extends Transaction {

    constructor(private filename: string) {
        super();
        console.log('copy', filename)
    }

    async preExecute(compiler: Compiler) {
    }

    get fileDependencies(): string[] {
        return [this.filename];
    }
    async execute(compilation: Compilation): Promise<void> {


        const compiler = compilation.compiler;
        const filename = this.filename;
        const assetsFileSystem = getAssetsFileSystem();
        if (await assetsFileSystem.needUpdate(filename)) {
            try {
                const content = await readFileAsync(compiler, filename);
                assetsFileSystem.update(compilation, { filePath: filename, dependencies: [] }, content);
            }
            catch (e) {
                const message = `\t模块加载失败:\n\t文件访问异常:${filename}`;
                const webpackError = new WebpackError(message);
                webpackError.file = 'egretProperties.json';
                compilation.getErrors().push(webpackError);
            }
        }
    }

}
