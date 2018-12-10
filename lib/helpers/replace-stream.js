'use strict';

/**
 * Dependencies
 */
const rw = require("rw-stream");
const {PassThrough} = require("stream");
const {makeReplacementsStream} = require("./make-replacement-stream");

/**
 * Helper to replace in a single file (async)
 */
module.exports = function replaceStream(file, from, to, encoding, dry) {
  const transform = makeReplacementsStream(from, to, encoding);

  return rw(file)
    .then(({ readStream, writeStream }) => {
      const changed = readStream.pipe(transform);

      if (dry) {
        const ret = new PassThrough({encoding}).on('data', () => 0);
        return changed.pipe(ret);
      }

      return changed.pipe(writeStream);
    })
    .then(
      (writeStream) => new Promise((resolve, reject) => {
        writeStream.on("error", reject);
        writeStream.on("finish", resolve);
      })
    )
    .then(() => transform.touched);
};

