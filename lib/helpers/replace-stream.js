'use strict';

/**
 * Dependencies
 */
const rw = require("rw-stream");
const {Transform, PassThrough} = require("stream");

/**
 * Helper to replace in a single file (async)
 */
module.exports = function replaceStream(file, from, to, encoding, dry) {
  let touched = false;

  return new Promise((resolve, reject) => rw(file)
    .then(resolve, reject))
    .then(({ readStream, writeStream }) => {
      const changed = readStream.pipe(
        new Transform({
          encoding,
          transform(chunk, encoding, callback) {
            const oldLength = replacing.length - windowSize;
            replacing += chunk;
            let match = replacing.match(from);

            if (!match) {
              const prev = replacing.slice(0, oldLength);
              replacing = replacing.slice(oldLength);
              this.push(prev, encoding);
            }

            touched = true;
            while(match) {
              const newIndex = match ? match.index : -1;
              const prev = replacing.slice(0, newIndex);
              const advance = newIndex + match[0].length;
              fullIndex += advance;

              let after;
              if (typeof to === "function") { // move this outside
                after = to(...match, fullIndex, this);
              } else {
                after = to;
              }

              replacing = replacing.slice(advance);
              match = replacing.match(from);
              this.push(prev + after);
            }
            return callback();
          },
          flush(callback) {
            return callback(replacing.replace(from, to));
          }
        })
      );

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
    .then(() => touched);
};

