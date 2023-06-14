/*!
 * fs.js - promisified fs module for bcoin
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const fs = require('./modern');
const extra = require('./extra');

/*
 * Extra
 */

fs.copy = extra.copy;
fs.copySync = extra.copySync;
fs.empty = extra.empty;
fs.emptySync = extra.emptySync;
fs.exists = extra.exists;
fs.existsSync = extra.existsSync;
fs.lstatTry = extra.lstatTry;
fs.lstatTrySync = extra.lstatTrySync;
fs.mkdirp = extra.mkdirp;
fs.mkdirpSync = extra.mkdirpSync;
fs.move = extra.move;
fs.moveSync = extra.moveSync;
fs.outputFile = extra.outputFile;
fs.outputFileSync = extra.outputFileSync;
fs.readJSON = extra.readJSON;
fs.readJSONSync = extra.readJSONSync;
fs.remove = extra.remove;
fs.removeSync = extra.removeSync;
fs.rimraf = extra.remove; // Compat.
fs.rimrafSync = extra.removeSync; // Compat.
fs.statTry = extra.statTry;
fs.statTrySync = extra.statTrySync;
fs.stats = extra.stats;
fs.statsSync = extra.statsSync;
fs.statsTry = extra.statsTry;
fs.statsTrySync = extra.statsTrySync;
fs.traverse = extra.traverse;
fs.traverseSync = extra.traverseSync;
fs.walk = extra.walk;
fs.walkSync = extra.walkSync;
fs.writeJSON = extra.writeJSON;
fs.writeJSONSync = extra.writeJSONSync;

/*
 * Info
 */

fs.unsupported = false;

/*
 * Expose
 */

module.exports = fs;
