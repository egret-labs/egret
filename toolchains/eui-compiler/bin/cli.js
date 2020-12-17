#!/usr/bin/env node
const lib = require('../lib/index');
const fs = require('fs');
const args = require('args');
args.option('theme', 'theme file path');
args.option('mode', 'mode');
const params = args.parse(process.argv);
// const mode = params.mode;
lib.initilize('.');
lib.emitDts();
lib.emitJs();