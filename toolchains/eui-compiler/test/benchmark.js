const fs = require('fs');
const assert = require('assert');
const lib = require('../');
const mock = require('mock-fs');
const path = require('path');

// const compiler = new lib.EuiCompiler('./test-egret-project', 'commonjs2');
// const result = compiler.emit();
// const content = result[0].content;
// fs.writeFileSync("./test-egret-project/a.json", content, '');