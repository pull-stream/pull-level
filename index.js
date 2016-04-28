var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var pushable = require('pull-pushable')
var cat      = require('pull-cat')
var pw       = require('pull-window')
var post     = require('level-post')

function read(db, opts) {
  return toPull.read1(db.createReadStream(opts))
}

var live =
exports.live =
function (db, opts) {
  opts = opts || {}

  var l = pushable(function (err) {
    if(opts.onAbort) opts.onAbort(err)
    cleanup()
  })

  var cleanup = post(db, opts, function (ch) {
    if(opts.keys === false)
      l.push(ch.value)
    else if(opts.values === false)
      l.push(ch.key)
    else
      l.push(ch)
  })

  return l

}

exports.read =
exports.readStream =
exports.createReadStream = function (db, opts) {
  opts = opts || {}
  if(!(opts.tail || opts.live))
    return read(db, opts)

  //optionally notify when we switch from reading history to realtime
  var sync = opts.onSync && function (abort, cb) {
      opts.onSync(abort); cb(abort || true)
    }

  if(opts.onSync === true || opts.sync === true)
    sync = pull.values([{sync: true}])

  return cat([read(db, opts), sync, live(db, opts)])
}

exports.write =
exports.writeStream =
exports.createWriteStream = function (db, opts, done) {
  if('function' === typeof opts)
    done = opts, opts = null
  opts = opts || {}
  return pull(
    pull.map(function (e) {
      if(e.type) return e
      return {
        key   : e.key, 
        value : e.value,
        type  : e.value == null ? 'del' : 'put'
      }
    }),
    pw.recent(opts.windowSize, opts.windowTime || 100),
    pull.asyncMap(function (batch, cb) {
      db.batch(batch, cb)
    }),
    pull.drain(null, done)
  )
}

