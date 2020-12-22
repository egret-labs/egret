//@ts-check
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, afterEach } = require('mocha');
const { Lexer } = require('../../../lib/parser/lexer');



describe('parser-lexer', () => {


    const baselineDir = path.join(__dirname, 'baselines')
    const dirs = fs.readdirSync(baselineDir)
    const cwd = process.cwd();
    afterEach(function () {
        process.chdir(cwd);
    });
    for (const dir of dirs) {

        it(`parser-lexer-${dir}`, () => {
            process.chdir(path.join(baselineDir, dir));
            const content = fs.readFileSync('input.exml', 'utf-8');
            const lexer = new Lexer(content);
            const result = lexer.analysis();
            const expect = fs.readFileSync('token.json', 'utf-8');
            // fs.writeFileSync('output.json',JSON.stringify(result,null,4))
            assert.deepEqual(JSON.stringify(result, null, 4), expect);

        })

    }

})