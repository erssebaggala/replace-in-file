'use strict';

const {Transform} = require("stream");

module.exports = function makeReplacementsStream(from, to, encoding) {
  let replacing = "";
  const windowSize = 0;
  let fullIndex = 0;

  return new Transform({	  
    objectMode: true,
    encoding,
    transform (chunk, enc, callback) {

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
        //const newIndex = typeof match.index !== 'undefined' ? match.index : replacing.indexOf(match[0]);
		const newIndex = typeof match.index !== 'undefined' ? match.index : -1;
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
		//console.log(`newIndex: ${newIndex} advance:${advance} fullIndex:${fullIndex} replacing: ${replacing}, match:`, match, "  prev+after:", prev+after);
		
		this.push(prev + after);
		chunk = null;

      }
      callback();
    },
    flush(callback){
	  this.push(replacing.replace(from, to))
	  
	  return callback();
      //return callback(null,replacing.replace(from, to))
    }
  });
 
}
