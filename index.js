

var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var pushable = require('pull-pushable')
var cat      = require('pull-cat')
var window   = require('pull-window')
var fixRange = require('level-fix-range')
/*
function _reverse(db, opts) {
  console.log(opts)
  var read = toPull(db.createReadStream(opts))
  var first = true
  return pull.Source(function () {
    return function (abort, cb) {
      if(first) {
        first = false
        //there is a bug in the order that 
        read(abort, function (err, data) {
          console.log('REVERSE', err, data)
          if(err || opts.start && data.key > opts.start) {
            //read(true, function () {}) //abort
            opts.start = null
            console.log(opts)
            read = toPull(db.createReadStream(opts))
            read(null, cb)
          }
          else
            cb(err, data)
        })
      }
      else
        read(abort, cb)
    }
  })()
}
*/
function read(db, opts) {
  fixRange(opts)
//  if(opts.reverse) return _reverse(db, opts)
  return toPull(db.createReadStream(opts))
}

var live = 
exports.live = 
function (db, opts) {
  opts = opts || {}
  fixRange(opts)

  var l = pushable()
  var cleanup = db.post(opts, function (ch) {
    l.push(ch)
  })

  return l.pipe(pull.through(null, cleanup))

}

exports.read =
exports.readStream = 
exports.createReadStream = function (db, opts) {
  opts = opts || {}
  fixRange(opts)
  if(!opts.tail)
    return read(db, opts)
  return cat([read(db, opts), live(db, opts) ])
}

exports.write =
exports.writeStream = 
exports.createWriteStream = function (db, opts, done) {
  if('function' === typeof opts)
    done = opts, opts = null
  opts = opts || {}
  return pull.map(function (e) {
    if(e.type) return e
    return {
      key   : e.key, 
      value : e.value,
      type  : e.value == null ? 'del' : 'put'
    }
  })
  .pipe(window(opts.windowSize, opts.windowTime))
  .pipe(pull.asyncMap(function (batch, cb) {
    db.batch(batch, cb)
  }))
  .pipe(pull.onEnd(done))

}

