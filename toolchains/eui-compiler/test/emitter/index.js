//@ts-check
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, afterEach } = require('mocha');
const codegen = require('escodegen');
const parser = require('../../lib/util/parser')
const { JavaScriptEmitter, DeclarationEmitter, JSONEmitter } = require('../../lib/emitter');;
const typings = require('../../lib/util/typings');

const esprima = require('esprima');


describe('emitter', () => {


    const baselineDir = path.join(__dirname, 'baselines')
    const dirs = fs.readdirSync(baselineDir)
    //const ignoreList = ['animation', 'button', 'data-binding', 'ignore', 'layout', 'negative-number', 'scroller', 'simple', 'states'];
    const ignoreList = ['animation', 'ignore'];//['animation', 'button', 'data-binding', 'ignore'];
    //const dirs = ['data-binding']
    const cwd = process.cwd();
    afterEach(function () {
        process.chdir(cwd);
    });
    for (const dir of dirs) {
        if (ignoreList.includes(dir)) {
            continue;
        }
        it(`javascript-emitter-${dir}`, () => {
            process.chdir(path.join(baselineDir, dir));
            const content = fs.readFileSync('input.exml', 'utf-8');
            typings.initTypings();
            const skinNode = parser.generateAST(content)
            const emitter = new JavaScriptEmitter();
            const result = emitter.generateJavaScriptAST(skinNode);


            const outputJavaScript = fs.readFileSync('expected-output-js.txt', 'utf-8')
            const outputJavaScriptAst = esprima.parseScript(outputJavaScript);
            const formattedOutput = codegen.generate(outputJavaScriptAst);
            const formattedResult = codegen.generate(result);

            assert.deepEqual(formattedOutput, formattedResult)

        })

        it(`declaration-emitter-${dir}`, () => {
            process.chdir(path.join(baselineDir, dir));
            const content = fs.readFileSync('input.exml', 'utf-8');
            const skinNode = parser.generateAST(content)
            const emitter = new DeclarationEmitter();
            emitter.emitSkinNode('input.exml', skinNode);
            let result = emitter.getResult();
            result = result.split('\r').join('');
            let outputDeclaration = fs.readFileSync("expected-output-d-ts.txt", 'utf-8');
            outputDeclaration = outputDeclaration.split('\r').join('');
            assert.equal(outputDeclaration, result);
        })
        //continue;
        it(`json-emitter-${dir}`, () => {
            process.chdir(path.join(baselineDir, dir));
            const content = fs.readFileSync('input.exml', 'utf-8');
            const skinNode = parser.generateAST(content)
            const emitter = new JSONEmitter();
            emitter.emitSkinNode('input.exml', skinNode);
            const result = emitter.getResult();
            const outputDeclaration = fs.readFileSync("expected-output-json.txt", 'utf-8');

            assert.deepEqual(JSON.parse(outputDeclaration), JSON.parse(result));
        })
    }

})