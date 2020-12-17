//@ts-check
const minifyTransformer = require('../').minifyTransformer;
const ts = require('typescript');
const fs = require('fs-extra-plus')
const path = require("path")
const assert = require('assert');
const { describe, it } = require('mocha');

const options = {
    mode: 'debug'
}

describe('transformer', () => {

    const dirs = fs.readdirSync('./test/baselines/');
    for (const dir of dirs) {
        it(`transformer-${dir}`, async () => {
            const fulldir = path.join("./test/baselines", dir)
            const compiledResult = formatter(await compile(fulldir));
            const expectOutputContent = fs.readFileSync(path.join(fulldir, 'expect-output.js'), 'utf-8')
            const expectedResult = formatter(expectOutputContent);
            assert.equal(compiledResult, expectedResult);
        })
    }
})



function compile(dir) {

    return new Promise((resolve, reject) => {
        const compileOptions = {
            noEmitOnError: false,
            noImplicitAny: true,
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS
        }

        let program = ts.createProgram([path.join(dir, 'input.ts')], compileOptions);

        const customTransformer = {
            before: [
                // @ts-ignore
                minifyTransformer(program, options)
            ]
        }
        let emitResult = program.emit(undefined, (filename, data) => {
            if (filename.indexOf("input.js") >= 0) {
                resolve(data);
            }
        }, undefined, undefined, customTransformer);
    })
}


function formatter(data) {
    const ts = require('typescript');
    const inputFile = ts.createSourceFile('./a.ts', data, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    const outputFile = ts.createSourceFile('./someFileName.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    const result = printer.printNode(ts.EmitHint.Unspecified, inputFile, outputFile);
    return result;
}

