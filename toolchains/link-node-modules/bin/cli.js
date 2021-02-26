#!/usr/bin/env node
const lib = require('../dist/index');
const packageDir = process.argv[2];
lib.linkNodeModules(packageDir, process.cwd());