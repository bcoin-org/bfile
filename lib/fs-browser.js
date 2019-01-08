/*!
 * fs-browser.js - promisified fs module for bcoin
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/*
 * Constants
 */

const constants = {
  UV_FS_SYMLINK_DIR: 1,
  UV_FS_SYMLINK_JUNCTION: 2,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  UV_DIRENT_UNKNOWN: 0,
  UV_DIRENT_FILE: 1,
  UV_DIRENT_DIR: 2,
  UV_DIRENT_LINK: 3,
  UV_DIRENT_FIFO: 4,
  UV_DIRENT_SOCKET: 5,
  UV_DIRENT_CHAR: 6,
  UV_DIRENT_BLOCK: 7,
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,
  O_CREAT: 64,
  O_EXCL: 128,
  O_NOCTTY: 256,
  O_TRUNC: 512,
  O_APPEND: 1024,
  O_DIRECTORY: 65536,
  O_NOATIME: 262144,
  O_NOFOLLOW: 131072,
  O_SYNC: 1052672,
  O_DSYNC: 4096,
  O_DIRECT: 16384,
  O_NONBLOCK: 2048,
  S_IRWXU: 448,
  S_IRUSR: 256,
  S_IWUSR: 128,
  S_IXUSR: 64,
  S_IRWXG: 56,
  S_IRGRP: 32,
  S_IWGRP: 16,
  S_IXGRP: 8,
  S_IRWXO: 7,
  S_IROTH: 4,
  S_IWOTH: 2,
  S_IXOTH: 1,
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  UV_FS_COPYFILE_EXCL: 1,
  COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,
  COPYFILE_FICLONE_FORCE: 4
};

/*
 * Errors
 */

function fsError(options) {
  const code = options.code || 'EPERM';
  const errno = options.errno || -1;
  const message = options.message;
  const syscall = options.syscall;
  const path = options.path;
  const start = options.start || fsError;

  let msg = `${code}:`;

  if (message)
    msg += ` ${message},`;

  if (syscall)
    msg += ` ${syscall}`;

  if (path)
    msg += ` ${path}`;

  const err = new Error(msg);

  err.code = code;
  err.errno = errno;

  if (syscall != null)
    err.syscall = syscall;

  if (path != null)
    err.path = path;

  if (Error.captureStackTrace)
    Error.captureStackTrace(err, start);

  return err;
}

function makeEnoent(syscall, path) {
  if (typeof path !== 'string')
    path = '/';

  return fsError({
    code: 'ENOENT',
    errno: -2,
    message: 'no such file or directory',
    syscall,
    path,
    start: makeEnoent
  });
}

function makeEbadf(syscall) {
  return fsError({
    code: 'EBADF',
    errno: -9,
    message: 'bad file descriptor',
    syscall,
    path: '/',
    start: makeEbadf
  });
}

function enoent(syscall) {
  return async (path) => {
    throw makeEnoent(syscall, path);
  };
}

function enoentSync(syscall) {
  return (path) => {
    throw makeEnoent(syscall, path);
  };
}

function ebadf(syscall) {
  return async () => {
    throw makeEbadf(syscall);
  };
}

function ebadfSync(syscall) {
  return () => {
    throw makeEbadf(syscall);
  };
}

/*
 * Noop
 */

async function noop() {}

function noopSync() {}

/*
 * Streams
 */

const readStream = {
  emit: noopSync,
  on: (event, handler) => {
    if (event === 'error')
      handler(makeEnoent('stat'));
  },
  once: (event, handler) => {
    if (event === 'error')
      handler(makeEnoent('stat'));
  },
  addListener: (event, handler) => {
    if (event === 'error')
      handler(makeEnoent('stat'));
  },
  removeListener: noopSync,
  removeAllListeners: noopSync,
  listeners: () => [],
  listenerCount: () => 0,
  readable: true,
  writable: false,
  pipe: enoent('stat'),
  write: noopSync,
  end: noopSync,
  close: noopSync,
  destroy: noopSync
};

const writeStream = {
  emit: noopSync,
  on: noopSync,
  once: noopSync,
  addListener: noopSync,
  removeListener: noopSync,
  removeAllListeners: noopSync,
  listeners: () => [],
  listenerCount: () => 0,
  readable: false,
  writable: true,
  write: () => true,
  end: () => true,
  close: noopSync,
  destroy: noopSync
};

/*
 * Expose
 */

exports.unsupported = true;
exports.version = 0x000000;
exports.hasPromises = false;
exports.access = enoent('stat');
exports.accessSync = enoentSync('stat');
exports.appendFile = enoent('open');
exports.appendFileSync = enoentSync('open');
exports.chmod = noop;
exports.chmodSync = noopSync;
exports.chown = noop;
exports.chownSync = noopSync;
exports.close = ebadf('close');
exports.closeSync = ebadfSync('close');
exports.constants = constants;
exports.copyFile = noop;
exports.copyFileSync = noopSync;
exports.createReadStream = () => readStream;
exports.createWriteStream = () => writeStream;
exports.fchmod = ebadf('fchmod');
exports.fchmodSync = ebadfSync('fchmod');
exports.fchown = ebadf('fchown');
exports.fchownSync = ebadfSync('fchown');
exports.fdatasync = ebadf('fdatasync');
exports.fdatasyncSync = ebadfSync('fdatasync');
exports.fstat = ebadf('fstat');
exports.fstatSync = ebadfSync('fstat');
exports.fsync = ebadf('fsync');
exports.fsyncSync = ebadfSync('fsync');
exports.ftruncate = ebadf('ftruncate');
exports.ftruncateSync = ebadfSync('ftruncate');
exports.futimes = ebadf('futimes');
exports.futimesSync = ebadfSync('futimes');
exports.lchmod = noop;
exports.lchmodSync = noopSync;
exports.lchown = noop;
exports.lchownSync = noopSync;
exports.link = noop;
exports.linkSync = noopSync;
exports.lstat = enoent('lstat');
exports.lstatSync = enoentSync('lstat');
exports.mkdir = noop;
exports.mkdirSync = noopSync;
exports.mkdtemp = async () => `/tmp/${Math.random().toString(36)}`;
exports.mkdtempSync = () => `/tmp/${Math.random().toString(36)}`;
exports.open = enoent('open');
exports.openSync = enoentSync('open');
exports.read = ebadf('read');
exports.readSync = ebadfSync('read');
exports.readdir = enoent('readdir');
exports.readdirSync = enoentSync('readdir');
exports.readFile = enoent('open');
exports.readFileSync = enoentSync('open');
exports.readlink = enoent('readlink');
exports.readlinkSync = enoentSync('readlink');
exports.realpath = enoent('stat');
exports.realpath.native = enoent('stat');
exports.realpathSync = enoentSync('stat');
exports.realpathSync.native = enoentSync('stat');
exports.rename = noop;
exports.renameSync = noopSync;
exports.rmdir = noop;
exports.rmdirSync = noopSync;
exports.stat = enoent('stat');
exports.statSync = enoentSync('stat');
exports.symlink = noop;
exports.symlinkSync = noopSync;
exports.truncate = noop;
exports.truncateSync = noopSync;
exports.unlink = noop;
exports.unlinkSync = noopSync;
exports.unwatchFile = noopSync;
exports.utimes = noop;
exports.utimesSync = noopSync;
exports.watch = () => readStream;
exports.watchFile = noopSync;
exports.write = ebadf('write');
exports.writeSync = ebadfSync('write');
exports.writeFile = noop;
exports.writeFileSync = noopSync;

exports.F_OK = exports.constants.F_OK || 0;
exports.R_OK = exports.constants.R_OK || 0;
exports.W_OK = exports.constants.W_OK || 0;
exports.X_OK = exports.constants.X_OK || 0;

exports.Dirent = class Dirent {};
exports.Stats = class Stats {};
exports.ReadStream = class ReadStream {};
exports.WriteStream = class WriteStream {};
exports.FileReadStream = class FileReadStream {};
exports.FileWriteStream = class FileWriteStream {};

exports.promises = exports;

exports.openHandle = exports.open;
exports.openFile = exports.open;

exports.copy = noop;
exports.copySync = noopSync;
exports.exists = async () => false;
exports.existsSync = () => false;
exports.lstatTry = async () => null;
exports.lstatTrySync = () => null;
exports.mkdirp = noop;
exports.mkdirpSync = noopSync;
exports.rimraf = noop;
exports.rimrafSync = noopSync;
exports.statTry = async () => null;
exports.statTrySync = () => null;
