/*!
 * legacy.js - legacy backend for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const compat = require('./compat');
const features = require('./features');
const modern = require('./modern');

/*
 * Legacy
 */

const legacy = {
  ...modern,
  constants: Object.assign(Object.create(null), modern.constants)
};

if (!features.HAS_STAT_NUMBERS
    || !features.HAS_STAT_BIGINTS
    || !features.HAS_STAT_NANO) {
  legacy.fstat = compat.fstat;
  legacy.fstatSync = compat.fstatSync;
  legacy.stat = compat.stat;
  legacy.statSync = compat.statSync;
  legacy.lstat = compat.lstat;
  legacy.lstatSync = compat.lstatSync;
}

if (!features.HAS_COPY_FILE_IMPL) {
  legacy.constants.COPYFILE_EXCL = compat.COPYFILE_EXCL;
  legacy.constants.COPYFILE_FICLONE = compat.COPYFILE_FICLONE;
  legacy.constants.COPYFILE_FICLONE_FORCE = compat.COPYFILE_FICLONE_FORCE;
  legacy.copyFile = compat.copyFile;
  legacy.copyFileSync = compat.copyFileSync;
}

if (!features.HAS_REALPATH_NATIVE_IMPL) {
  legacy.realpath = compat.realpath;
  // @ts-ignore
  legacy.realpathSync = compat.realpathSync;
}

if (!features.HAS_PROMISES_IMPL) {
  Object.defineProperty(modern, 'promises', {
    configurable: true,
    enumerable: false,
    get() {
      return compat.promises;
    }
  });
}

if (!features.HAS_DIRENT_IMPL) {
  legacy.readdir = compat.readdir;
  // @ts-ignore
  legacy.readdirSync = compat.readdirSync;
  legacy.Dirent = compat.Dirent;
}

if (!features.HAS_RW_TYPED_ARRAY) {
  legacy.read = compat.read;
  legacy.readSync = compat.readSync;
  legacy.write = compat.write;
  legacy.writeSync = compat.writeSync;
  legacy.writeFile = compat.writeFile;
  legacy.writeFileSync = compat.writeFileSync;
}

if (!features.HAS_RECURSIVE_MKDIR) {
  legacy.mkdir = compat.mkdir;
  // @ts-ignore
  legacy.mkdirSync = compat.mkdirSync;
}

if (!features.HAS_OPTIONAL_FLAGS) {
  legacy.open = compat.open;
  legacy.openSync = compat.openSync;
}

if (!features.HAS_WRITEV_IMPL) {
  legacy.writev = compat.writev;
  legacy.writevSync = compat.writevSync;
}

if (!features.HAS_RECURSIVE_RMDIR) {
  legacy.rmdir = compat.rmdir;
  legacy.rmdirSync = compat.rmdirSync;
}

if (!features.HAS_OPENDIR_IMPL) {
  legacy.opendir = compat.opendir;
  // @ts-ignore
  legacy.opendirSync = compat.opendirSync;
  // @ts-ignore
  legacy.Dir = compat.Dir;
}

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

Object.defineProperties(legacy, {
  ReadStream: {
    get() {
      return modern.ReadStream;
    },
    set(val) {
      modern.ReadStream = val;
    }
  },
  WriteStream: {
    get() {
      return modern.WriteStream;
    },
    set(val) {
      modern.WriteStream = val;
    }
  },
  FileReadStream: {
    get() {
      return modern.ReadStream;
    },
    set(val) {
      modern.ReadStream = val;
    }
  },
  FileWriteStream: {
    get() {
      return modern.WriteStream;
    },
    set(val) {
      modern.WriteStream = val;
    }
  },
  promises: {
    configurable: true,
    enumerable: false,
    get() {
      return modern.promises;
    }
  }
});

// A few things still need patching even if we have native promises.
if (features.HAS_PROMISES_IMPL && !features.HAS_OPENDIR_IMPL) {
  const getter = Object.getOwnPropertyDescriptor(modern, 'promises').get;

  const getPromises = () => {
    if (features.HAS_STABLE_PROMISES)
      return getter();

    const emit = process.emitWarning;

    process.emitWarning = () => {};

    try {
      return getter();
    } finally {
      process.emitWarning = emit;
    }
  };

  let promises = null;

  Object.defineProperty(legacy, 'promises', {
    configurable: true,
    enumerable: false,
    get() {
      if (promises)
        return promises;

      promises = compat.clonePromises(getPromises());

      if (!features.HAS_STAT_BIGINTS
          || !features.HAS_STAT_NANO) {
        promises.stat = compat.promises.stat;
        compat.patchStat(promises);
      }

      if (!features.HAS_DIRENT_IMPL)
        promises.readdir = compat.promises.readdir;

      if (!features.HAS_RW_TYPED_ARRAY) {
        promises.writeFile = compat.promises.writeFile;
        compat.patchTypedArray(promises);
      }

      if (!features.HAS_RECURSIVE_MKDIR)
        promises.mkdir = compat.promises.mkdir;

      if (!features.HAS_OPTIONAL_FLAGS)
        compat.patchOpenFlags(promises);

      if (!features.HAS_WRITEV_IMPL)
        compat.patchWritev(promises);

      if (!features.HAS_RECURSIVE_RMDIR)
        promises.rmdir = compat.promises.rmdir;

      if (!features.HAS_OPENDIR_IMPL)
        promises.opendir = compat.promises.opendir;

      return promises;
    }
  });
}

/*
 * Expose
 */

module.exports = /** @type {legacy & LazyFSProps} */(legacy);
