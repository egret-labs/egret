// @ts-check
const { describe, it, afterEach } = require('mocha');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { ThemeFile } = require("../../lib/theme");

describe('sort-exml', () => {
    const caseDir = path.join(__dirname, 'case')
    const cwd = process.cwd();
    afterEach(function () {
        process.chdir(cwd);
    });
    it('sort-exml', () => {
        process.chdir(caseDir);
        const exmls = JSON.parse(fs.readFileSync('exmls.txt', 'utf-8'));
        const themeFile = new ThemeFile(caseDir, 'exmls.thm.json');
        themeFile.sort(exmls);
        const targetThemeFile = new ThemeFile(caseDir, 'exmls-sort.thm.json');
        const themeData = themeFile.data;
        const targetThemeData = targetThemeFile.data;
        assert.doesNotThrow(() => {
            for (let i = 0; i < themeData.exmls.length; i++) {
                if (themeData.exmls[i] !== targetThemeData.exmls[i]) {
                    throw new Error();
                }
            }
        })
    })
})