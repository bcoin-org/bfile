/*!
 * fs.js - promisified fs module for bcoin
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const backend = require('./backend');
const extra = require('./extra');
const features = require('./features');

const fs = {
  ...backend,

  handle: null,

  /*
   * Extra
   */

  copy: extra.copy,
  copySync: extra.copySync,
  empty: extra.empty,
  emptySync: extra.emptySync,
  exists: extra.exists,
  existsSync: extra.existsSync,
  lstatTry: extra.lstatTry,
  lstatTrySync: extra.lstatTrySync,
  mkdirp: extra.mkdirp,
  mkdirpSync: extra.mkdirpSync,
  move: extra.move,
  moveSync: extra.moveSync,
  outputFile: extra.outputFile,
  outputFileSync: extra.outputFileSync,
  readJSON: extra.readJSON,
  readJSONSync: extra.readJSONSync,
  remove: extra.remove,
  removeSync: extra.removeSync,
  rimraf: extra.remove, // Compat.
  rimrafSync: extra.removeSync, // Compat.
  statTry: extra.statTry,
  statTrySync: extra.statTrySync,
  stats: extra.stats,
  statsSync: extra.statsSync,
  statsTry: extra.statsTry,
  statsTrySync: extra.statsTrySync,
  traverse: extra.traverse,
  traverseSync: extra.traverseSync,
  walk: extra.walk,
  walkSync: extra.walkSync,
  writeJSON: extra.writeJSON,
  writeJSONSync: extra.writeJSONSync,

  /*
   * Info
   */

  features: features,
  unsupported: false
};

/*
 * Promises
 */

if (features.USE_STABLE_PROMISES) {
  // @ts-ignore
  const native = backend.realpath.native;

  fs.access = backend.promises.access;
  fs.appendFile = backend.promises.appendFile;
  fs.chmod = backend.promises.chmod;
  fs.chown = backend.promises.chown;
  fs.copyFile = backend.promises.copyFile;
  fs.lchmod = backend.promises.lchmod;
  fs.lchown = backend.promises.lchown;
  fs.link = backend.promises.link;
  fs.lstat = backend.promises.lstat;
  fs.mkdir = backend.promises.mkdir;
  fs.mkdtemp = backend.promises.mkdtemp;
  fs.opendir = backend.promises.opendir;
  fs.handle = backend.promises.open;
  fs.readdir = backend.promises.readdir;
  fs.readFile = backend.promises.readFile;
  fs.readlink = backend.promises.readlink;
  fs.realpath = backend.promises.realpath;
  fs.rename = backend.promises.rename;
  fs.rmdir = backend.promises.rmdir;
  fs.stat = backend.promises.stat;
  fs.symlink = backend.promises.symlink;
  fs.truncate = backend.promises.truncate;
  fs.unlink = backend.promises.unlink;
  fs.utimes = backend.promises.utimes;
  fs.writeFile = backend.promises.writeFile;

  // fs.realpath.native does not
  // currently exist for promises.
  // @ts-ignore
  if (!backend.realpath.native) {
    fs.realpath = function realpath(...args) {
      // @ts-ignore
      return backend.promises.realpath(...args);
    };
    // @ts-ignore
    fs.realpath.native = native;
  }
} else {
  let compat = null;

  Object.defineProperties(fs, {
    handle: {
      configurable: true,
      enumerable: false,
      get() {
        if (!compat)
          compat = require('./compat');

        return compat.promises.open;
      }
    }
  });
}

Object.defineProperties(fs, {
  ReadStream: {
    get() {
      return backend.ReadStream;
    },
    set(val) {
      backend.ReadStream = val;
    }
  },
  WriteStream: {
    get() {
      return backend.WriteStream;
    },
    set(val) {
      backend.WriteStream = val;
    }
  },
  FileReadStream: {
    get() {
      return backend.ReadStream;
    },
    set(val) {
      backend.ReadStream = val;
    }
  },
  FileWriteStream: {
    get() {
      return backend.WriteStream;
    },
    set(val) {
      backend.WriteStream = val;
    }
  },
  promises: {
    configurable: true,
    get() {
      return backend.promises;
    }
  }
});

/** @typedef {import('fs').WriteStream} WriteStream */
/** @typedef {import('fs').ReadStream} ReadStream */
/** @typedef {import('fs').promises} promises */

/**
 * @typedef {Object} LazyFSProps
 * @property {WriteStream} WriteStream
 * @property {ReadStream} ReadStream
 * @property {WriteStream} FileWriteStream
 * @property {ReadStream} FileReadStream
 * @property {promises} promises
 */

/*
 * Expose
 */

module.exports = /** @type {fs & LazyFSProps} */(fs);
