/*!
 * extra.js - extra functions for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const path = require('path');
const {ArgError, FSError} = require('./error');
const fs = require('./backend');
const {fromPath} = require('./util');
const {join, resolve} = path;
const {EEXIST, EPERM} = FSError;

/*
 * Constants
 */

const ASYNC_ITERATOR = Symbol.asyncIterator || 'asyncIterator';

/*
 * Extra
 */

async function copy(src, dest, flags, filter) {
  if (typeof flags === 'function')
    [flags, filter] = [filter, flags];

  if (flags == null)
    flags = 0;

  if (filter == null)
    filter = async (src, stat) => true;

  src = fromPath(src);
  dest = fromPath(dest);

  if ((flags >>> 0) !== flags)
    throw new ArgError('flags', flags, 'integer');

  if (typeof filter !== 'function')
    throw new ArgError('filter', filter, 'function');

  const overwrite = (flags & fs.constants.COPYFILE_EXCL) === 0;
  const sstat = await fs.lstat(src);
  const dstat = await lstatTry(dest);

  let ret = 0;

  if (!overwrite && dstat)
    throw new FSError(EEXIST, 'copy', dest);

  if (dstat
      && sstat.dev === dstat.dev
      && sstat.ino === dstat.ino
      && sstat.rdev === dstat.rdev) {
    throw new FSError(EPERM, 'cannot copy file into itself', 'copy', dest);
  }

  if (!await filter(src, sstat))
    return ret + 1;

  if (sstat.isDirectory()) {
    const list = await fs.readdir(src);

    if (dstat) {
      if (!dstat.isDirectory())
        throw new FSError(EEXIST, 'mkdir', dest);
    } else {
      await fs.mkdir(dest, sstat.mode);
    }

    for (const name of list) {
      ret += await copy(join(src, name),
                        join(dest, name),
                        flags,
                        filter);
    }

    return ret;
  }

  if (sstat.isSymbolicLink()) {
    if (dstat) {
      if (!dstat.isFIFO()
          && !dstat.isFile()
          && !dstat.isSocket()
          && !dstat.isSymbolicLink()) {
        throw new FSError(EEXIST, 'symlink', dest);
      }

      await fs.unlink(dest);
    }

    await fs.symlink(await fs.readlink(src), dest);

    return ret;
  }

  if (sstat.isFile()) {
    if (dstat) {
      if (!dstat.isFIFO()
          && !dstat.isFile()
          && !dstat.isSocket()
          && !dstat.isSymbolicLink()) {
        throw new FSError(EEXIST, 'open', dest);
      }

      if (!dstat.isFile())
        await fs.unlink(dest);
    }

    await fs.copyFile(src, dest, flags);

    return ret;
  }

  return ret + 1;
}

function copySync(src, dest, flags, filter) {
  if (typeof flags === 'function')
    [flags, filter] = [filter, flags];

  if (flags == null)
    flags = 0;

  if (filter == null)
    filter = (src, stat) => true;

  src = fromPath(src);
  dest = fromPath(dest);

  if ((flags >>> 0) !== flags)
    throw new ArgError('flags', flags, 'integer');

  if (typeof filter !== 'function')
    throw new ArgError('filter', filter, 'function');

  const overwrite = (flags & fs.constants.COPYFILE_EXCL) === 0;
  const sstat = fs.lstatSync(src);
  const dstat = lstatTrySync(dest);

  let ret = 0;

  if (!overwrite && dstat)
    throw new FSError(EEXIST, 'copy', dest);

  if (dstat
      && sstat.dev === dstat.dev
      && sstat.ino === dstat.ino
      && sstat.rdev === dstat.rdev) {
    throw new FSError(EPERM, 'cannot copy file into itself', 'copy', dest);
  }

  if (!filter(src, sstat))
    return ret + 1;

  if (sstat.isDirectory()) {
    const list = fs.readdirSync(src);

    if (dstat) {
      if (!dstat.isDirectory())
        throw new FSError(EEXIST, 'mkdir', dest);
    } else {
      fs.mkdirSync(dest, sstat.mode);
    }

    for (const name of list) {
      ret += copySync(join(src, name),
                      join(dest, name),
                      flags,
                      filter);
    }

    return ret;
  }

  if (sstat.isSymbolicLink()) {
    if (dstat) {
      if (!dstat.isFIFO()
          && !dstat.isFile()
          && !dstat.isSocket()
          && !dstat.isSymbolicLink()) {
        throw new FSError(EEXIST, 'symlink', dest);
      }

      fs.unlinkSync(dest);
    }

    fs.symlinkSync(fs.readlinkSync(src), dest);

    return ret;
  }

  if (sstat.isFile()) {
    if (dstat) {
      if (!dstat.isFIFO()
          && !dstat.isFile()
          && !dstat.isSocket()
          && !dstat.isSymbolicLink()) {
        throw new FSError(EEXIST, 'open', dest);
      }

      if (!dstat.isFile())
        fs.unlinkSync(dest);
    }

    fs.copyFileSync(src, dest, flags);

    return ret;
  }

  return ret + 1;
}

async function exists(file, mode) {
  if (mode == null)
    mode = fs.constants.F_OK;

  try {
    await fs.access(file, mode);
    return true;
  } catch (e) {
    if (isNoEntry(e))
      return false;
    throw e;
  }
}

function existsSync(file, mode) {
  if (mode == null)
    mode = fs.constants.F_OK;

  try {
    fs.accessSync(file, mode);
    return true;
  } catch (e) {
    if (isNoEntry(e))
      return false;
    throw e;
  }
}

async function lstatTry(...args) {
  try {
    return await fs.lstat(...args);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

function lstatTrySync(...args) {
  try {
    return fs.lstatSync(...args);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

async function mkdirp(dir, mode) {
  if (mode == null)
    mode = 0o777;

  return fs.mkdir(dir, { mode, recursive: true });
}

function mkdirpSync(dir, mode) {
  if (mode == null)
    mode = 0o777;

  return fs.mkdirSync(dir, { mode, recursive: true });
}

async function rimraf(path, filter) {
  if (filter == null)
    filter = async (path, stat) => true;

  path = fromPath(path);

  if (typeof filter !== 'function')
    throw new ArgError('filter', filter, 'function');

  let ret = 0;
  let stat = null;

  try {
    stat = await fs.lstat(path);
  } catch (e) {
    if (isNoEntry(e))
      return ret + 1;
    throw e;
  }

  if (!await filter(path, stat))
    return ret + 1;

  if (stat.isDirectory()) {
    let list = null;

    try {
      list = await fs.readdir(path);
    } catch (e) {
      if (isNoEntry(e))
        return ret + 1;
      throw e;
    }

    for (const name of list)
      ret += await rimraf(join(path, name), filter);

    try {
      await fs.rmdir(path);
    } catch (e) {
      if (isNoEntry(e) || e.code === 'ENOTEMPTY')
        return ret + 1;
      throw e;
    }

    return ret;
  }

  try {
    await fs.unlink(path);
  } catch (e) {
    if (isNoEntry(e))
      return ret + 1;
    throw e;
  }

  return ret;
}

function rimrafSync(path, filter) {
  if (filter == null)
    filter = (path, stat) => true;

  path = fromPath(path);

  if (typeof filter !== 'function')
    throw new ArgError('filter', filter, 'function');

  let ret = 0;
  let stat = null;

  try {
    stat = fs.lstatSync(path);
  } catch (e) {
    if (isNoEntry(e))
      return ret + 1;
    throw e;
  }

  if (!filter(path, stat))
    return ret + 1;

  if (stat.isDirectory()) {
    let list = null;

    try {
      list = fs.readdirSync(path);
    } catch (e) {
      if (isNoEntry(e))
        return ret + 1;
      throw e;
    }

    for (const name of list)
      ret += rimrafSync(join(path, name), filter);

    try {
      fs.rmdirSync(path);
    } catch (e) {
      if (isNoEntry(e) || e.code === 'ENOTEMPTY')
        return ret + 1;
      throw e;
    }

    return ret;
  }

  try {
    fs.unlinkSync(path);
  } catch (e) {
    if (isNoEntry(e))
      return ret + 1;
    throw e;
  }

  return ret;
}

async function statTry(...args) {
  try {
    return await fs.stat(...args);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

function statTrySync(...args) {
  try {
    return fs.statSync(...args);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

async function stats(file, options) {
  let [follow, opt] = parseStatsOptions(options);

  // Avoid a bug with
  // option parsing.
  if (opt == null)
    opt = {};

  if (follow) {
    try {
      return await fs.stat(file, opt);
    } catch (e) {
      if (!isNoEntry(e))
        throw e;
    }
  }

  return await fs.lstat(file, opt);
}

function statsSync(file, options) {
  const [follow, opt] = parseStatsOptions(options);

  if (follow) {
    try {
      return fs.statSync(file, opt);
    } catch (e) {
      if (!isNoEntry(e))
        throw e;
    }
  }

  return fs.lstatSync(file, opt);
}

async function statsTry(file, options) {
  try {
    return await stats(file, options);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

function statsTrySync(file, options) {
  try {
    return statsSync(file, options);
  } catch (e) {
    if (isNoEntry(e))
      return null;
    throw e;
  }
}

/*
 * Traversal
 */

async function traverse(root, options, cb) {
  if (Array.isArray(root)) {
    for (const file of root)
      await traverse(fromPath(file), options, cb);
    return;
  }

  const path = fromPath(root);

  if (typeof options === 'function')
    [options, cb] = [null, options];

  if (typeof cb !== 'function')
    throw new ArgError('callback', cb, 'function');

  const [follow, maxDepth] = parseWalkOptions(options);
  const seen = new Set();

  await (async function next(path, depth) {
    const stat = await statsTry(path, options);

    let result = cb(path, stat, depth);

    if (result instanceof Promise)
      result = await result;

    if (result === false)
      return false;

    if (stat && stat.isDirectory()) {
      if (depth === maxDepth)
        return true;

      if (follow) {
        let real = resolve(path);

        try {
          real = await fs.realpath(real);
        } catch (e) {
          if (!isNoEntry(e))
            throw e;
        }

        if (seen.has(real))
          return true;

        seen.add(real);
      }

      let list = null;

      try {
        list = await fs.readdir(path);
      } catch (e) {
        if (isNoEntry(e))
          return true;
        throw e;
      }

      for (const name of list) {
        if (!await next(join(path, name), depth + 1, cb))
          return false;
      }
    }

    return true;
  })(path, 0);
}

function traverseSync(root, options, cb) {
  if (typeof options === 'function')
    [options, cb] = [null, options];

  if (typeof cb !== 'function')
    throw new ArgError('callback', cb, 'function');

  for (const [file, stat, depth] of walkSync(root, options)) {
    if (cb(file, stat, depth) === false)
      break;
  }
}

function walk(root, options) {
  const paths = [];

  if (Array.isArray(root)) {
    for (const file of root)
      paths.push(fromPath(file));
  } else {
    paths.push(root);
  }

  const [follow, maxDepth] = parseWalkOptions(options);

  return new AsyncWalker(paths, follow, maxDepth);
}

function* walkSync(root, options) {
  if (Array.isArray(root)) {
    for (const file of root)
      yield* walkSync(fromPath(file), options);
    return;
  }

  const path = fromPath(root);
  const [follow, maxDepth] = parseWalkOptions(options);
  const seen = new Set();

  yield* (function* next(path, depth) {
    const stat = statsTrySync(path, options);

    yield [path, stat, depth];

    if (stat && stat.isDirectory()) {
      if (depth === maxDepth)
        return;

      if (follow) {
        let real = resolve(path);

        try {
          real = fs.realpathSync(real);
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
        list = fs.readdirSync(path);
      } catch (e) {
        if (isNoEntry(e))
          return;
        throw e;
      }

      for (const name of list)
        yield* next(join(path, name), depth + 1);
    }
  })(path, 0);
}

/**
 * AsyncWalker
 */

class AsyncWalker {
  constructor(paths, follow, maxDepth) {
    this.stack = [paths.reverse()];
    this.follow = follow;
    this.maxDepth = maxDepth;
    this.seen = new Set();
    this.depth = 0;
  }

  [ASYNC_ITERATOR]() {
    return this;
  }

  get() {
    if (this.stack.length === 0)
      return null;

    const items = this.stack[this.stack.length - 1];

    if (items.length === 0)
      return null;

    return items.pop();
  }

  pop() {
    if (this.stack.length === 0)
      return;

    const items = this.stack[this.stack.length - 1];

    if (items.length === 0) {
      this.stack.pop();
      this.depth -= 1;
    }
  }

  async read(path, stat) {
    if (!stat || !stat.isDirectory())
      return false;

    if (this.depth === this.maxDepth)
      return false;

    if (this.follow) {
      let real = resolve(path);

      try {
        real = await fs.realpath(real);
      } catch (e) {
        if (!isNoEntry(e))
          throw e;
      }

      if (this.seen.has(real))
        return false;

      this.seen.add(real);
    }

    let list = null;

    try {
      list = await fs.readdir(path);
    } catch (e) {
      if (isNoEntry(e))
        return false;
      throw e;
    }

    if (list.length === 0)
      return false;

    const items = [];

    for (let i = list.length - 1; i >= 0; i--)
      items.push(join(path, list[i]));

    this.stack.push(items);
    this.depth += 1;

    return true;
  }

  async next() {
    this.pop();

    const depth = this.depth;
    const path = this.get();

    if (path == null)
      return { value: undefined, done: true };

    const stat = await statsTry(path, this.options);

    if (!await this.read(path, stat))
      this.pop();

    return { value: [path, stat, depth], done: false };
  }
}

/*
 * Helpers
 */

function isNoEntry(err) {
  if (!err)
    return false;

  return err.code === 'ENOENT'
      || err.code === 'EACCES'
      || err.code === 'EPERM'
      || err.code === 'ELOOP';
}

function parseStatsOptions(options) {
  if (options == null)
    return [false, undefined];

  if (typeof options === 'boolean')
    return [options, undefined];

  if (typeof options !== 'object')
    throw new ArgError('options', options, 'object');

  let {follow, bigint} = options;

  if (follow == null)
    follow = false;

  if (bigint == null)
    bigint = false;

  if (typeof follow !== 'boolean')
    throw new ArgError('follow', follow, 'boolean');

  if (typeof bigint !== 'boolean')
    throw new ArgError('bigint', bigint, 'boolean');

  return [follow, { bigint }];
}

function parseWalkOptions(options) {
  if (options == null)
    return [false, -1];

  if (typeof options === 'boolean')
    return [options, -1];

  if (typeof options !== 'object')
    throw new ArgError('options', options, 'object');

  let {follow, maxDepth} = options;

  if (follow == null)
    follow = false;

  if (maxDepth == null)
    maxDepth = -1;

  if (typeof follow !== 'boolean')
    throw new ArgError('follow', follow, 'boolean');

  if (maxDepth !== -1 && (maxDepth >>> 0) !== maxDepth)
    throw new ArgError('maxDepth', maxDepth, 'integer');

  return [follow, maxDepth];
}

/*
 * Expose
 */

exports.copy = copy;
exports.copySync = copySync;
exports.exists = exists;
exports.existsSync = existsSync;
exports.lstatTry = lstatTry;
exports.lstatTrySync = lstatTrySync;
exports.mkdirp = mkdirp;
exports.mkdirpSync = mkdirpSync;
exports.rimraf = rimraf;
exports.rimrafSync = rimrafSync;
exports.statTry = statTry;
exports.statTrySync = statTrySync;
exports.stats = stats;
exports.statsSync = statsSync;
exports.statsTry = statsTry;
exports.statsTrySync = statsTrySync;
exports.traverse = traverse;
exports.traverseSync = traverseSync;
exports.walk = walk;
exports.walkSync = walkSync;
