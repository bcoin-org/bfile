/*!
 * error.js - extra functions for bfile
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
};

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
};

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
