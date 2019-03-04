# bfile

Filesystem wrapper for node.js. Provides a promisified API, along with a
consistent interface accross node.js versions. All changes to the node.js fs
API are tracked and accounted for in:

- [lib/features.js]
- [lib/legacy.js]
- [lib/compat.js]

bfile will wrap older implementations to modernize them. Supports node@8.0.0
and up.

## Usage

``` js
const fs = require('bfile');

(async () => {
  await fs.writeFile('./foobar', 'Hello world!');

  console.log(await fs.readFile('./foobar'));

  for await (const [file] of fs.walk('.'))
    console.log(`Found file: ${file}`);
})();
```

## Extras

In addition to the default FS API, bfile provides some extra helpers.

### API

#### Methods

- `fs.copy(src, dest, [filter(path, stat)])` (async) - Recursive copy.
  Optionally accepts a filter callback.
- `fs.copySync(src, dest, [filter(path, stat)])` - Synchronous `fs.copy`.
- `fs.exists(path, [mode])` (async) - A fixed version of `fs.exists`. Basically
  a wrapper around `fs.access` which returns true or false.
- `fs.existsSync(path, [mode])` - Synchronous `fs.exists`.
- `fs.lstatTry(path, [options])` (async) - A version of `fs.lstat` which
  returns `null` on `ENOENT` or `EACCES`.
- `fs.lstatTrySync(path, [options])` - Synchronous `fs.lstatTry`.
- `fs.mkdirp(path, [mode])` (async) - Alias to
  `fs.mkdir(path, { recursive: true })`.
- `fs.mkdirpSync(path, [mode])` - Synchronous `fs.mkdirp`.
- `fs.rimraf(path, [filter(path, stat)])` (async) - Recursive removal.
  Optionally accepts a filter callback.
- `fs.rimrafSync(path, [filter(path, stat)])` - Synchronous `fs.rimraf`.
- `fs.statTry(path, [options])` (async) - A version of `fs.stat` which returns
  `null` on `ENOENT` or `EACCES`.
- `fs.statTrySync(path, [options])` - Synchronous `fs.statTry`.
- `fs.stats(path, [options])` (async) - A stat function which will attempt to
  call `fs.lstat` if `fs.stat` fails with `ENOENT` or `EACCES` (depending on
  options). This is useful for detecting broken symlinks and getting their
  appropriate stat object. Accepts options in the form of
  `{ follow: [boolean], bigint: [boolean] }`.
- `fs.statsSync(path, [options])` - Synchronous `fs.stats`.
- `fs.statsTry(path, [options])` (async) - A version of `fs.stats` which
  returns `null` on `ENOENT` or `EACCES`.
- `fs.statsTrySync(path, [options])` - Synchronous `fs.statsTry`.
- `fs.traverse(paths, [options], callback)` (async) - Callback version of
  `fs.walk`.
- `fs.traverseSync(paths, [options], callback)` - Synchronous `fs.traverse`.
- `fs.walk(paths, [options])` - An async iterator which recursively walks the
  target path/paths.  Returns entries in the form of `[path, stat, depth]`.
  Note that `stat` may be `null` in the event of an `EACCES`, `EPERM`, or
  `ELOOP`.
- `fs.walkSync(paths, [options])` - Synchronous `fs.walk`.

#### Options

##### `fs.stats` options

`fs.stats` and `fs.statsSync` accept an object with properties:

- `follow` - A boolean indicating whether to attempt calling `fs.stat` before
  `fs.lstat`. If false, behavior is identical to `fs.lstat` (default: `false`).
- `bigint` - A boolean indiciating whether to use `BigInt`s on the `fs.Stats`
  struct (default: `false`).

##### `fs.{traverse,walk}` options

`fs.traverse`, `fs.traverseSync`, `fs.walk`, and `fs.walkSync` accept an object
with properties:

- `bigint` - A boolean indiciating whether to use `BigInt`s on the `fs.Stats`
  struct (default: `false`).
- `filesOnly` - A boolean indicating whether to return directories in the
  iterated results (default: `false`).
- `filter(path, stat, depth)` - A callback to filter determine directories are
  entered and which files are returned. Note that `stat` may be `null`
  (default: `null`).
- `follow` - A boolean indicating whether to follow symlinks. Note that the
  walking functions are smart enough to avoid recursive symlink loops (default:
  `false`).
- `maxDepth` - Maximum depth to traverse. For reference, `paths` are depth `0`.
  Set to `-1` for no limit (default: `-1`).

### Options

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

- Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).

See LICENSE for more info.

[lib/features.js]: https://github.com/bcoin-org/bfile/blob/master/lib/features.js
[lib/legacy.js]: https://github.com/bcoin-org/bfile/blob/master/lib/legacy.js
[lib/compat.js]: https://github.com/bcoin-org/bfile/blob/master/lib/compat.js
