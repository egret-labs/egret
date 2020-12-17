
import * as crypto from 'crypto';

export class CachedFile {

    public filePath: string;
    private hash: string;

    constructor(filePath: string, private compiler: import("webpack").Compiler) {
        this.filePath = filePath;


        const existed = existedInFileSystem(compiler.inputFileSystem, filePath);
        const data = existed ? this.compiler.inputFileSystem.readFileSync(filePath) : "";
        this.hash = existed ? crypto.createHash('md5').update(data.toString()).digest("hex") : "";

        // this.hash = !fs.existsSync(filePath) ? '' : crypto.createHash('md5')
        //     .update(fs.readFileSync(filePath).toString())
        //     .digest('hex');
    }

    update(content: string | Buffer) {
        // const newHash = crypto.createHash('md5')
        //     .update(content)
        //     .digest('hex');

        const newHash = crypto.createHash('md5').update(content.toString()).digest('hex');
        if (this.hash !== newHash) {
            this.hash = newHash;
            this.compiler.outputFileSystem.writeFile(this.filePath, content, function () {

            });
            // fs.writeFileSync(this.filePath, content);
        }
    }
}

function existedInFileSystem(inputFileSystem: any, p: string) {
    try {
        inputFileSystem.statSync(p);
        return true;
    }
    catch (e) {
        return false;
    }
    return false;
}