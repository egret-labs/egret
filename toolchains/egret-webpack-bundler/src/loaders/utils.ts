import * as path from 'path';
import * as webpack from 'webpack';

// 添加automatically头
export function generateContent(content: string) {
    return `// This file is automatically generated by build\n${content}`;
}

// stringify之后用这个 更新require语句
export function unescapeRequire(content: string) {
    return content.replace(/"__(require|asset)\(([^"]+)\)"/g, (all, cmd, p) => {
        if (cmd === 'require') {
            return `require("${p}")`;
        } else if (cmd === 'asset') {
            return `__webpack_public_path__ + "${p}"`;
        }
        return all;
    });
}

// 判断文件是否是webpack构建的entry
export function isEntry(compiler: webpack.Compiler, resourcePath: string) {
    const { entry } = compiler.options;
    return Object.values(entry).some((v) => {
        let item = v.import;
        if (!Array.isArray(item)) {
            item = [item];
        }
        return item.some((p: string) => {
            p = p.replace(/^.*!/, '');
            // TODO 如果文件没有后缀将判断失误 例如 './src/Main'
            if (!path.isAbsolute(p)) {
                p = path.join(compiler.context, p);
            }
            return p === resourcePath;
        });
    });
}

// // 判断是否需要热更新
// export function isHot(compiler) {
//   const { mode, devServer } = compiler.options;
//   return mode === 'development' && devServer && devServer.hot;
// }

// 获取相对路径
// eg: src/Main.ts src/common/Component.ts => ./common/Component.ts
export function relative(parent: string, relative: string) {
    if (path.isAbsolute(relative)) {
        relative = path.relative(path.dirname(parent), relative).replace(/\\/g, '/');

        if (!/^[\.\/]/.test(relative)) {
            relative = `./${relative}`;
        }
    }
    return relative;
}

export function readFileAsync(compiler: webpack.Compiler, filepath: string) {
    return new Promise<Buffer>((resolve, reject) => {
        compiler.inputFileSystem.readFile(filepath, (error, content) => {
            if (error) {
                reject(new Error(`文件访问异常:${filepath}`));
            } else {
                resolve(content as Buffer);
            }
        })
    })
}

export function fileChanged(compiler: webpack.Compiler, fullpath: string) {
    if (!compiler.modifiedFiles) {
        return true;
    }
    return compiler.modifiedFiles.has(fullpath);
}