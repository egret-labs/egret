#!/usr/bin/env node
const lib = require('../dist/index');
const path = require('path');
const packageDir = path.resolve(process.cwd(), process.argv[2]);
lib.linkNodeModules(packageDir, process.cwd());