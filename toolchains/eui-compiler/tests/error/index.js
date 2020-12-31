//@ts-check
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, afterEach } = require('mocha');
const parser = require('../../lib/util/parser')
const typings = require('../../lib/util/typings');



describe('parser-error', () => {


    const baselineDir = path.join(__dirname, 'baselines')
    const dirs = fs.readdirSync(baselineDir)
    const cwd = process.cwd();
    afterEach(function () {
        process.chdir(cwd);
    });
    for (const dir of dirs) {

        it(`parser-error-${dir}`, () => {
            process.chdir(path.join(baselineDir, dir));
            const content = fs.readFileSync('input.exml', 'utf-8');
            const result = fs.readFileSync('expect.txt', 'utf-8');
            typings.initTypings();
            const skinNode = parser.generateAST(content, '');
            const err = skinNode.errors.shift();
            assert.deepEqual(err.message.replace(/\t/g, '        ').trim(), result.trim());
        })

    }

})