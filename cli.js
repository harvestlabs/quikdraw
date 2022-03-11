#!/usr/bin/env node
global.randomBytes = require("crypto").randomBytes;
require("./dist/index.js");
