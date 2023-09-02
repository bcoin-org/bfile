/*!
 * backend.js - backend selection for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const features = require('./features');

/*
 * Expose
 */

if (features.HAS_ALL) {
  const modern = require('./modern');

  module.exports = modern;
} else {
  const legacy = require('./legacy');

  module.exports = legacy;
}
