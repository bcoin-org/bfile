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
const {join} = path;
const {EEXIST, EPERM} = FSError;

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
    if (e.code === 'ENOENT')
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
    if (e.code === 'ENOENT')
      return false;
    throw e;
  }
}

async function lstatTry(...args) {
  try {
    return await fs.lstat(...args);
  } catch (e) {
    if (e.code === 'ENOENT')
      return null;
    throw e;
  }
}

function lstatTrySync(...args) {
  try {
    return fs.lstatSync(...args);
  } catch (e) {
    if (e.code === 'ENOENT')
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
    if (e.code === 'ENOENT' || e.code === 'EACCES')
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
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return ret + 1;
      throw e;
    }

    for (const name of list)
      ret += await rimraf(join(path, name), filter);

    try {
      await fs.rmdir(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES' || e.code === 'ENOTEMPTY')
        return ret + 1;
      throw e;
    }

    return ret;
  }

  try {
    await fs.unlink(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
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
    if (e.code === 'ENOENT' || e.code === 'EACCES')
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
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return ret + 1;
      throw e;
    }

    for (const name of list)
      ret += rimrafSync(join(path, name), filter);

    try {
      fs.rmdirSync(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES' || e.code === 'ENOTEMPTY')
        return ret + 1;
      throw e;
    }

    return ret;
  }

  try {
    fs.unlinkSync(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
      return ret + 1;
    throw e;
  }

  return ret;
}

async function statTry(...args) {
  try {
    return await fs.stat(...args);
  } catch (e) {
    if (e.code === 'ENOENT')
      return null;
    throw e;
  }
}

function statTrySync(...args) {
  try {
    return fs.statSync(...args);
  } catch (e) {
    if (e.code === 'ENOENT')
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
      if (e.code !== 'ENOENT')
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
      if (e.code !== 'ENOENT')
        throw e;
    }
  }

  return fs.lstatSync(file, opt);
}

async function statsTry(file, options) {
  try {
    return await stats(file, options);
  } catch (e) {
    if (e.code === 'ENOENT')
      return null;
    throw e;
  }
}

function statsTrySync(file, options) {
  try {
    return statsSync(file, options);
  } catch (e) {
    if (e.code === 'ENOENT')
      return null;
    throw e;
  }
}

async function traverse(root, options, cb) {
  const path = fromPath(root);

  if (typeof options === 'function')
    [options, cb] = [null, options];

  if (typeof cb !== 'function')
    throw new ArgError('callback', cb, 'function');

  await (async function next(path, depth) {
    const stat = await stats(path, options);

    let result = cb(path, stat, depth);

    if (result instanceof Promise)
      result = await result;

    if (result === false)
      return;

    if (stat.isDirectory()) {
      for (const name of (await fs.readdir(path)))
        await next(join(path, name), depth + 1, cb);
    }
  })(path, 0);
}

function traverseSync(root, options, cb) {
  const path = fromPath(root);

  if (typeof options === 'function')
    [options, cb] = [null, options];

  if (typeof cb !== 'function')
    throw new ArgError('callback', cb, 'function');

  (function next(path, depth) {
    const stat = statsSync(path, options);

    if (cb(path, stat, depth) === false)
      return;

    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(path))
        next(join(path, name), depth + 1, cb);
    }
  })(path, 0);
}

let walk = null;

try {
  walk = require('./walk')(stats);
} catch (e) {
  ;
}

function* walkSync(root, options) {
  const path = fromPath(root);

  yield* (function* next(path, depth) {
    const stat = statsSync(path, options);

    yield [path, stat, depth];

    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(path))
        yield* next(join(path, name), depth + 1);
    }
  })(path, 0);
}

/*
 * Helpers
 */

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
