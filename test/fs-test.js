/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('assert');
const {resolve} = require('path');
const fs = require('../');
const {COPYFILE_EXCL} = fs.constants;

const REAL_LIB = resolve(__dirname, '..', 'lib');
const DATA = resolve(__dirname, 'data');
const LIB = resolve(DATA, 'lib');

const LIB_FILES = [
  'bfile.js',
  'fs-browser.js',
  'fs.js'
];

function validateLib() {
  const list = fs.readdirSync(LIB);

  assert.deepStrictEqual(list.sort(), LIB_FILES);

  for (const name of LIB_FILES) {
    const file = resolve(LIB, name);
    const stat = fs.statSync(file);
    assert(stat.isFile());
  }

  for (const name of LIB_FILES) {
    const file = resolve(LIB, name);
    const real = resolve(REAL_LIB, name);
    const fileData = fs.readFileSync(file);
    const realData = fs.readFileSync(real);

    assert(fileData.equals(realData));
  }
}

describe('FS', function() {
  if (process.browser)
    return;

  it('should have environment', () => {
    assert(fs && typeof fs === 'object');
    assert(fs.unsupported === false);
  });

  describe('Sync', function() {
    it('should do rimraf (1)', () => {
      fs.rimrafSync(DATA);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });

    it('should do mkdirp', () => {
      fs.mkdirpSync(LIB, 0o755);
      assert(fs.statSync(DATA).isDirectory());
      assert(fs.statSync(LIB).isDirectory());
    });

    it('should do recursive copy (1)', () => {
      assert.strictEqual(fs.copySync(REAL_LIB, LIB), 0);

      validateLib();

      assert.strictEqual(fs.copySync(REAL_LIB, LIB), 0);

      validateLib();

      assert.throws(() => {
        fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (2)', () => {
      assert.strictEqual(fs.rimrafSync(DATA), 0);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });

    it('should do mkdir', () => {
      fs.mkdirSync(DATA, 0o755);
      assert(fs.statSync(DATA).isDirectory());
      assert(!fs.existsSync(LIB));
    });

    it('should do recursive copy (2)', () => {
      assert.strictEqual(fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL), 0);

      validateLib();

      assert.throws(() => {
        fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should fail to do recursive copy', () => {
      assert.throws(() => {
        fs.copySync(LIB, LIB);
      }, /EPERM/);

      assert.throws(() => {
        fs.copySync(LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (3)', () => {
      assert.strictEqual(fs.rimrafSync(DATA), 0);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });
  });

  describe('Async', function() {
    it('should do rimraf (1)', async () => {
      await fs.rimraf(DATA);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });

    it('should do mkdirp', async () => {
      await fs.mkdirp(LIB, 0o755);
      assert((await fs.stat(DATA)).isDirectory());
      assert((await fs.stat(LIB)).isDirectory());
    });

    it('should do recursive copy (1)', async () => {
      assert.strictEqual(await fs.copy(REAL_LIB, LIB), 0);

      validateLib();

      assert.strictEqual(await fs.copy(REAL_LIB, LIB), 0);

      validateLib();

      await assert.rejects(async () => {
        await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (2)', async () => {
      assert.strictEqual(await fs.rimraf(DATA), 0);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });

    it('should do mkdir', async () => {
      await fs.mkdir(DATA, 0o755);
      assert((await fs.stat(DATA)).isDirectory());
      assert(!await fs.exists(LIB));
    });

    it('should do recursive copy (2)', async () => {
      assert.strictEqual(await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL), 0);

      validateLib();

      await assert.rejects(async () => {
        await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should fail to do recursive copy', async () => {
      await assert.rejects(async () => {
        await fs.copy(LIB, LIB);
      }, /EPERM/);

      await assert.rejects(async () => {
        await fs.copy(LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (3)', async () => {
      assert.strictEqual(await fs.rimraf(DATA), 0);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });
  });
});
