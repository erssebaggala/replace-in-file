const {Transform} = require("stream");

module.exports = function makeReplacementsStream(from, to, encoding) {
  let replacing = "";

  new Transform({
    encoding,
    transform (chunk, encoding, callback) {
      const oldLength = replacing.length - windowSize;
      replacing += chunk;
      let match = replacing.match(from);
      if (!match) {
        const prev = replacing.slice(0, oldLength);
        replacing = replacing.slice(oldLength);
        this.push(prev, encoding);
        return callback();
      }
      this.touched = true;
      while (match) {
        const newIndex = match ? match.index : -1;
        const prev = replacing.slice(0, newIndex);
        const advance = newIndex + match[0].length;
        fullIndex += advance;
        let after;
        if (typeof to === "function") { // move this outside
          after = to(...match, fullIndex, this);
        }
        else {
          after = to;
        }
        replacing = replacing.slice(advance);
        match = replacing.match(from);
        this.push(prev + after);
      }
      return callback();
    },
    flush(callback) {
      return callback(replacing.replace(from, to))
    }
  });
  return transform;
}
