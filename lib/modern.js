/*!
 * modern.js - modern backend for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

/* eslint prefer-arrow-callback: "off" */

'use strict';

const fs = require('fs');
const {promisify} = require('./util');

const modern = {};

/*
 * Expose
 */

modern.access = promisify(fs.access);
modern.accessSync = fs.accessSync;
modern.appendFile = promisify(fs.appendFile);
modern.appendFileSync = fs.appendFileSync;
modern.chmod = promisify(fs.chmod);
modern.chmodSync = fs.chmodSync;
modern.chown = promisify(fs.chown);
modern.chownSync = fs.chownSync;
modern.close = promisify(fs.close);
modern.closeSync = fs.closeSync;
modern.constants = fs.constants;
modern.copyFile = promisify(fs.copyFile);
modern.copyFileSync = fs.copyFileSync;
modern.createReadStream = fs.createReadStream;
modern.createWriteStream = fs.createWriteStream;
modern.existsSync = fs.existsSync;
modern.fchmod = promisify(fs.fchmod);
modern.fchmodSync = fs.fchmodSync;
modern.fchown = promisify(fs.fchown);
modern.fchownSync = fs.fchownSync;
modern.fdatasync = promisify(fs.fdatasync);
modern.fdatasyncSync = fs.fdatasyncSync;
modern.fstat = promisify(fs.fstat);
modern.fstatSync = fs.fstatSync;
modern.fsync = promisify(fs.fsync);
modern.fsyncSync = fs.fsyncSync;
modern.ftruncate = promisify(fs.ftruncate);
modern.ftruncateSync = fs.ftruncateSync;
modern.futimes = promisify(fs.futimes);
modern.futimesSync = fs.futimesSync;
modern.lchmod = promisify(fs.lchmod);
modern.lchmodSync = fs.lchmodSync;
modern.lchown = promisify(fs.lchown);
modern.lchownSync = fs.lchownSync;
modern.link = promisify(fs.link);
modern.linkSync = fs.linkSync;
modern.lstat = promisify(fs.lstat);
modern.lstatSync = fs.lstatSync;
modern.mkdir = promisify(fs.mkdir);
modern.mkdirSync = fs.mkdirSync;
modern.mkdtemp = promisify(fs.mkdtemp);
modern.mkdtempSync = fs.mkdtempSync;
modern.open = promisify(fs.open);
modern.openSync = fs.openSync;
modern.opendir = promisify(fs.opendir);
modern.opendirSync = fs.opendirSync;
modern.readSync = fs.readSync;
modern.readdir = promisify(fs.readdir);
modern.readdirSync = fs.readdirSync;
modern.readFile = promisify(fs.readFile);
modern.readFileSync = fs.readFileSync;
modern.readlink = promisify(fs.readlink);
modern.readlinkSync = fs.readlinkSync;
modern.realpath = promisify(fs.realpath);
// @ts-ignore
modern.realpath.native = promisify(fs.realpath.native);
modern.realpathSync = fs.realpathSync;
modern.rename = promisify(fs.rename);
modern.renameSync = fs.renameSync;
modern.rmdir = promisify(fs.rmdir);
modern.rmdirSync = fs.rmdirSync;
modern.stat = promisify(fs.stat);
modern.statSync = fs.statSync;
modern.symlink = promisify(fs.symlink);
modern.symlinkSync = fs.symlinkSync;
modern.truncate = promisify(fs.truncate);
modern.truncateSync = fs.truncateSync;
modern.unlink = promisify(fs.unlink);
modern.unlinkSync = fs.unlinkSync;
modern.unwatchFile = fs.unwatchFile;
modern.utimes = promisify(fs.utimes);
modern.utimesSync = fs.utimesSync;
modern.watch = fs.watch;
modern.watchFile = fs.watchFile;
modern.writeSync = fs.writeSync;
modern.writeFile = promisify(fs.writeFile);
modern.writeFileSync = fs.writeFileSync;
modern.writev = promisify(fs.writev);
modern.writevSync = fs.writevSync;

modern.exists = function exists(file) {
  return new Promise(function(resolve, reject) {
    try {
      fs.exists(file, resolve);
    } catch (e) {
      reject(e);
    }
  });
};

modern.read = function read(fd, buffer, offset, length, position) {
  return new Promise(function(resolve, reject) {
    const cb = function(err, bytes, buffer) {
      if (err) {
        reject(err);
        return;
      }
      resolve(bytes);
    };

    try {
      fs.read(fd, buffer, offset, length, position, cb);
    } catch (e) {
      reject(e);
    }
  });
};

modern.write = function write(fd, buffer, offset, length, position) {
  return new Promise(function(resolve, reject) {
    const cb = function(err, bytes, buffer) {
      if (err) {
        reject(err);
        return;
      }
      resolve(bytes);
    };

    if (typeof buffer === 'string') {
      // fs.write(fd, string[, position[, encoding]], callback);
      if (length == null)
        length = 'utf8';

      try {
        fs.write(fd, buffer, offset, length, cb);
      } catch (e) {
        reject(e);
      }
    } else {
      // fs.write(fd, buffer[, offset[, length[, position]]], callback);
      try {
        fs.write(fd, buffer, offset, length, position, cb);
      } catch (e) {
        reject(e);
      }
    }
  });
};

modern.F_OK = fs.constants.F_OK || 0;
modern.R_OK = fs.constants.R_OK || 0;
modern.W_OK = fs.constants.W_OK || 0;
modern.X_OK = fs.constants.X_OK || 0;

modern.Dirent = fs.Dirent;
modern.Stats = fs.Stats;

/**
 * @typedef {Object} LazyFSProps
 * @property {fs.WriteStream} WriteStream
 * @property {fs.ReadStream} ReadStream
 * @property {fs.WriteStream} FileWriteStream
 * @property {fs.ReadStream} FileReadStream
 * @property {fs.promises} promises
 */

Object.defineProperties(modern, {
  ReadStream: {
    get() {
      return fs.ReadStream;
    },
    set(val) {
      fs.ReadStream = val;
    }
  },
  WriteStream: {
    get() {
      return fs.WriteStream;
    },
    set(val) {
      fs.WriteStream = val;
    }
  },
  FileReadStream: {
    get() {
      return fs.ReadStream;
    },
    set(val) {
      fs.ReadStream = val;
    }
  },
  FileWriteStream: {
    get() {
      return fs.WriteStream;
    },
    set(val) {
      fs.WriteStream = val;
    }
  },
  promises: {
    configurable: true,
    enumerable: false,
    get() {
      return fs.promises;
    }
  }
});

/*
 * Expose
 */

module.exports = /* @type {modern & LazyFSProps} */(modern);
