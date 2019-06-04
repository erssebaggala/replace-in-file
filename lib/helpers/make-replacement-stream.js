'use strict';

const {Transform} = require("stream");

module.exports = function makeReplacementsStream(from, to, encoding) {
	let replacing = "";
	const windowSize = 0;
	let fullIndex = 0;
  
	if (!Array.isArray(from)) {
		from = [from];
		to = [to]
	}

  return new Transform({	  
    objectMode: true,
    encoding,
    transform (chunk, enc, callback) {
		
		const oldLength = replacing.length - windowSize;
		replacing += chunk;
		
		for(let i = 0; i < from.length; i++){
			let frm = from[i];
		    let t = to[i];
			
			let match = replacing.match(frm);
		  
			if (!match) {
				const prev = replacing.slice(0, oldLength);
				replacing = replacing.slice(oldLength);
				if( prev.length > 0 ) this.push(prev, encoding);
				return callback();
			}
			
			this.touched = true
		  
			while (match) {
				const newIndex = typeof match.index !== 'undefined' ? match.index : replacing.indexOf(match[0]);
				const prev = replacing.slice(0, newIndex);
				const advance = newIndex + match[0].length;
				fullIndex += advance;
				let after;
				if (typeof t === "function") { // move this outside
				  after = t(...match, fullIndex, this);
				}
				else {
				  after = t;
				}
				replacing = replacing.slice(advance);
				match = replacing.match(frm);

				this.push(prev + after);
			}
		  
		};
		
      callback();
    },
    flush(callback){
		//const remaining  = replacing.replace(from, to);
		let remaining = "";
		
		for(let i = 0; i < from.length; i++){
			let frm = from[i];
			let t = to[i];
			remaining = replacing.replace(frm,t);
		}
		
		if( remaining.length > 0 ) this.push(remaining);

		replacing = "";
		return callback();
    }
  });
 
}
