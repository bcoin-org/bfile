/*!
 * fs.js - promisified fs module for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const fs = require('fs');
const Path = require('path');

/*
 * Helpers
 */

function promisify(func) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      args.push(function(err, result) {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
      func.call(this, ...args);
    });
  };
}

function parsePath(path) {
  path = path.replace(/\\/g, '/');
  path = path.replace(/(^|\/)\.\//, '$1');
  path = path.replace(/\/+\.?$/, '');

  const parts = path.split(/\/+/);

  let root = '';

  if (process.platform === 'win32') {
    if (parts[0].indexOf(':') !== -1)
      root = parts.shift() + '/';
  }

  if (parts.length > 0) {
    if (parts[0].length === 0) {
      parts.shift();
      root = '/';
    }
  }

  return [root, parts];
}

/*
 * Expose
 */

exports.unsupported = false;
exports.access = promisify(fs.access);
exports.accessSync = fs.accessSync;
exports.appendFile = promisify(fs.appendFile);
exports.appendFileSync = fs.appendFileSync;
exports.chmod = promisify(fs.chmod);
exports.chmodSync = fs.chmodSync;
exports.chown = promisify(fs.chown);
exports.chownSync = fs.chownSync;
exports.close = promisify(fs.close);
exports.closeSync = fs.closeSync;
exports.constants = fs.constants;
exports.createReadStream = fs.createReadStream;
exports.createWriteStream = fs.createWriteStream;
exports.fchmod = promisify(fs.fchmod);
exports.fchmodSync = fs.fchmodSync;
exports.fchown = promisify(fs.fchown);
exports.fchownSync = fs.fchownSync;
exports.fdatasync = promisify(fs.fdatasync);
exports.fdatasyncSync = fs.fdatasyncSync;
exports.fstat = promisify(fs.fstat);
exports.fstatSync = fs.fstatSync;
exports.fsync = promisify(fs.fsync);
exports.fsyncSync = fs.fsyncSync;
exports.ftruncate = promisify(fs.ftruncate);
exports.ftruncateSync = fs.ftruncateSync;
exports.futimes = promisify(fs.futimes);
exports.futimesSync = fs.futimesSync;
exports.lchmod = promisify(fs.lchmod);
exports.lchmodSync = fs.lchmodSync;
exports.lchown = promisify(fs.lchown);
exports.lchownSync = fs.lchownSync;
exports.link = promisify(fs.link);
exports.linkSync = fs.linkSync;
exports.lstat = promisify(fs.lstat);
exports.lstatSync = fs.lstatSync;
exports.mkdir = promisify(fs.mkdir);
exports.mkdirSync = fs.mkdirSync;
exports.mkdtemp = promisify(fs.mkdtemp);
exports.mkdtempSync = fs.mkdtempSync;
exports.open = promisify(fs.open);
exports.openSync = fs.openSync;
exports.read = promisify(fs.read);
exports.readSync = fs.readSync;
exports.readdir = promisify(fs.readdir);
exports.readdirSync = fs.readdirSync;
exports.readFile = promisify(fs.readFile);
exports.readFileSync = fs.readFileSync;
exports.readlink = promisify(fs.readlink);
exports.readlinkSync = fs.readlinkSync;
exports.realpath = promisify(fs.realpath);
exports.realpathSync = fs.realpathSync;
exports.rename = promisify(fs.rename);
exports.renameSync = fs.renameSync;
exports.rmdir = promisify(fs.rmdir);
exports.rmdirSync = fs.rmdirSync;
exports.stat = promisify(fs.stat);
exports.statSync = fs.statSync;
exports.symlink = promisify(fs.symlink);
exports.symlinkSync = fs.symlinkSync;
exports.truncate = promisify(fs.truncate);
exports.truncateSync = fs.truncateSync;
exports.unlink = promisify(fs.unlink);
exports.unlinkSync = fs.unlinkSync;
exports.unwatchFile = fs.unwatchFile;
exports.utimes = promisify(fs.utimes);
exports.utimesSync = fs.utimesSync;
exports.watch = fs.watch;
exports.watchFile = fs.watchFile;
exports.write = promisify(fs.write);
exports.writeSync = fs.writeSync;
exports.writeFile = promisify(fs.writeFile);
exports.writeFileSync = fs.writeFileSync;

exports.exists = async (file) => {
  try {
    await exports.stat(file);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT')
      return false;
    throw e;
  }
};

exports.existsSync = (file) => {
  try {
    exports.statSync(file);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT')
      return false;
    throw e;
  }
};

exports.rimraf = async function rimraf(path) {
  let stat = null;

  try {
    stat = await exports.lstat(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
      return;
    throw e;
  }

  if (stat.isDirectory()) {
    let list = null;

    try {
      list = await exports.readdir(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return;
      throw e;
    }

    for (const name of list) {
      const file = Path.join(path, name);
      await exports.rimraf(file);
    }

    try {
      await exports.rmdir(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return;
      throw e;
    }

    return;
  }

  try {
    await exports.unlink(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
      return;
    throw e;
  }
};

exports.rimrafSync = function rimrafSync(path) {
  let stat = null;

  try {
    stat = exports.lstatSync(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
      return;
    throw e;
  }

  if (stat.isDirectory()) {
    let list = null;

    try {
      list = exports.readdirSync(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return;
      throw e;
    }

    for (const name of list) {
      const file = Path.join(path, name);
      exports.rimrafSync(file);
    }

    try {
      exports.rmdirSync(path);
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES')
        return;
      throw e;
    }

    return;
  }

  try {
    exports.unlinkSync(path);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EACCES')
      return;
    throw e;
  }
};

exports.mkdirp = async function mkdirp(dir, mode) {
  if (mode == null)
    mode = 0o777;

  let [path, parts] = parsePath(dir);

  for (const part of parts) {
    path += part;

    try {
      const stat = await exports.stat(path);
      if (!stat.isDirectory())
        throw new Error('Could not create directory.');
    } catch (e) {
      if (e.code === 'ENOENT')
        await exports.mkdir(path, mode);
      else
        throw e;
    }

    path += '/';
  }
};

exports.mkdirpSync = function mkdirpSync(dir, mode) {
  if (mode == null)
    mode = 0o777;

  let [path, parts] = parsePath(dir);

  for (const part of parts) {
    path += part;

    try {
      const stat = exports.statSync(path);
      if (!stat.isDirectory())
        throw new Error('Could not create directory.');
    } catch (e) {
      if (e.code === 'ENOENT')
        exports.mkdirSync(path, mode);
      else
        throw e;
    }

    path += '/';
  }
};