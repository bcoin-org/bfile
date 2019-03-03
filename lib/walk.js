/*!
 * walk.js - async walk iterator for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const path = require('path');
const fs = require('./backend');
const {fromPath} = require('./util');
const {join, resolve} = path;

/*
 * Walk
 */

function create(statsTry, isNoEntry, parseWalkOptions) {
  return async function* walk(root, options) {
    if (Array.isArray(root)) {
      for (const file of root)
        yield* await walk(fromPath(file), options);
      return;
    }

    const path = fromPath(root);
    const [follow, maxDepth] = parseWalkOptions(options);
    const seen = new Set();

    yield* await (async function* next(path, depth) {
      const stat = await statsTry(path, options);

      yield [path, stat, depth];

      if (stat && stat.isDirectory()) {
        if (depth === maxDepth)
          return;

        if (follow) {
          let real = resolve(path);

          try {
            real = await fs.realpath(real);
          } catch (e) {
            if (!isNoEntry(e))
              throw e;
          }

          if (seen.has(real))
            return;

          seen.add(real);
        }

        let list = null;

        try {
          list = await fs.readdir(path);
        } catch (e) {
          if (isNoEntry(e))
            return;
          throw e;
        }

        for (const name of list)
          yield* await next(join(path, name), depth + 1);
      }
    })(path, 0);
  };
}

/*
 * Expose
 */

module.exports = create;
