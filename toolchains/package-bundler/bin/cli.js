#!/usr/bin/env node
const lib = require('../dist');
const command = process.argv[2];
lib.build();