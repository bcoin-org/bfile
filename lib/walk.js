/*!
 * walk.js - async walk iterator for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const path = require('path');
const fs = require('./backend');
const {fromPath} = require('./util');
const {join} = path;

/*
 * Walk
 */

function create(stats) {
  return async function* walk(root, options) {
    const path = fromPath(root);

    yield* await (async function* next(path, depth) {
      const stat = await stats(path, options);

      yield [path, stat, depth];

      if (stat.isDirectory()) {
        for (const name of (await fs.readdir(path)))
          yield* await next(join(path, name), depth + 1);
      }
    })(path, 0);
  };
}

/*
 * Expose
 */

module.exports = create;
