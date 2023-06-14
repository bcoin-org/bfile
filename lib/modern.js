/*!
 * modern.js - modern backend for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

/* eslint prefer-arrow-callback: "off" */

'use strict';

const fs = require('fs');
const {promisify} = require('./util');

/*
 * Expose
 */

exports.access = fs.promises.access;
exports.accessSync = fs.accessSync;
exports.appendFile = fs.promises.appendFile;
exports.appendFileSync = fs.appendFileSync;
exports.chmod = fs.promises.chmod;
exports.chmodSync = fs.chmodSync;
exports.chown = fs.promises.chown;
exports.chownSync = fs.chownSync;
exports.close = promisify(fs.close);
exports.closeSync = fs.closeSync;
exports.constants = fs.constants;
exports.copyFile = fs.promises.copyFile;
exports.copyFileSync = fs.copyFileSync;
exports.createReadStream = fs.createReadStream;
exports.createWriteStream = fs.createWriteStream;
exports.exists = null;
exports.existsSync = fs.existsSync;
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
exports.handle = fs.promises.open;
exports.lchmod = fs.promises.lchmod;
exports.lchmodSync = fs.lchmodSync;
exports.lchown = fs.promises.lchown;
exports.lchownSync = fs.lchownSync;
exports.link = fs.promises.link;
exports.linkSync = fs.linkSync;
exports.lstat = fs.promises.lstat;
exports.lstatSync = fs.lstatSync;
exports.mkdir = fs.promises.mkdir;
exports.mkdirSync = fs.mkdirSync;
exports.mkdtemp = fs.promises.mkdtemp;
exports.mkdtempSync = fs.mkdtempSync;
exports.open = promisify(fs.open);
exports.openSync = fs.openSync;
exports.opendir = fs.promises.opendir;
exports.opendirSync = fs.opendirSync;
exports.read = null;
exports.readSync = fs.readSync;
exports.readdir = fs.promises.readdir;
exports.readdirSync = fs.readdirSync;
exports.readFile = fs.promises.readFile;
exports.readFileSync = fs.readFileSync;
exports.readlink = fs.promises.readlink;
exports.readlinkSync = fs.readlinkSync;
exports.realpath = fs.promises.realpath;
exports.realpath.native = promisify(fs.realpath.native);
exports.realpathSync = fs.realpathSync;
exports.rename = fs.promises.rename;
exports.renameSync = fs.renameSync;
exports.rm = fs.promises.rm;
exports.rmSync = fs.rmSync;
exports.rmdir = fs.promises.rmdir;
exports.rmdirSync = fs.rmdirSync;
exports.stat = fs.promises.stat;
exports.statSync = fs.statSync;
exports.symlink = fs.promises.symlink;
exports.symlinkSync = fs.symlinkSync;
exports.truncate = fs.promises.truncate;
exports.truncateSync = fs.truncateSync;
exports.unlink = fs.promises.unlink;
exports.unlinkSync = fs.unlinkSync;
exports.unwatchFile = fs.unwatchFile;
exports.utimes = fs.promises.utimes;
exports.utimesSync = fs.utimesSync;
exports.watch = fs.watch;
exports.watchFile = fs.watchFile;
exports.write = null;
exports.writeSync = fs.writeSync;
exports.writeFile = fs.promises.writeFile;
exports.writeFileSync = fs.writeFileSync;
exports.writev = promisify(fs.writev);
exports.writevSync = fs.writevSync;

exports.exists = function exists(file) {
  return new Promise(function(resolve, reject) {
    try {
      fs.exists(file, resolve);
    } catch (e) {
      reject(e);
    }
  });
};

exports.read = function read(fd, buffer, offset, length, position) {
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

exports.write = function write(fd, buffer, offset, length, position) {
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

exports.F_OK = fs.F_OK || 0;
exports.R_OK = fs.R_OK || 0;
exports.W_OK = fs.W_OK || 0;
exports.X_OK = fs.X_OK || 0;

exports.Dirent = fs.Dirent;
exports.Stats = fs.Stats;

Object.defineProperties(exports, {
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
      return fs.FileReadStream;
    },
    set(val) {
      fs.FileReadStream = val;
    }
  },
  FileWriteStream: {
    get() {
      return fs.FileWriteStream;
    },
    set(val) {
      fs.FileWriteStream = val;
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
