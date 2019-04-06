var toPull   = require('stream-to-pull-stream')

module.exports = function read(db, opts) {
  opts.live = false;
  return toPull.read1(db.createReadStream(opts))
}

