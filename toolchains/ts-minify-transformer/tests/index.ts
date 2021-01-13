const minifyTransformer = require('../').minifyTransformer;
import ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
const options = {
    mode: 'debug'
};

describe('transformer', () => {

    const dirs = fs.readdirSync('./tests/baselines/');
    for (const dir of dirs) {
        it(`transformer-${dir}`, async () => {
            const fulldir = path.join('./tests/baselines', dir);
            const compiledResult = formatter(await compile(fulldir));
            const expectOutputContent = fs.readFileSync(path.join(fulldir, 'expect-output.js'), 'utf-8');
            const expectedResult = formatter(expectOutputContent);

            expect(compiledResult).toBe(expectedResult);
        });
    }
});

function compile(dir: string) {

    return new Promise<string>((resolve, reject) => {
        const compileOptions = {
            noEmitOnError: false,
            noImplicitAny: true,
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS
        };

        const program = ts.createProgram([path.join(dir, 'input.ts')], compileOptions);

        const customTransformer = {
            before: [
                // @ts-ignore
                minifyTransformer(program, options)
            ]
        };
        const emitResult = program.emit(undefined, (filename, data) => {
            if (filename.indexOf('input.js') >= 0) {
                resolve(data);
            }
        }, undefined, undefined, customTransformer);
    });
}

function formatter(data: string) {
    const inputFile = ts.createSourceFile('./a.ts', data, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const outputFile = ts.createSourceFile('./someFileName.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printNode(ts.EmitHint.Unspecified, inputFile, outputFile);
    return result;
}

