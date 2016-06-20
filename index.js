var pull     = require('pull-stream/pull')
var Map      = require('pull-stream/throughs/map')
var AsyncMap = require('pull-stream/throughs/async-map')
var Drain    = require('pull-stream/sinks/drain')
var Live     = require('pull-live')

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

exports.old = read

exports.read =
exports.readStream =
exports.createReadStream = function (db, opts) {
  return Live(function (opts) {
    return read(db, opts)
  }, function (opts) {
    return live(db, opts)
  })(opts)
}

exports.write =
exports.writeStream =
exports.createWriteStream = function (db, opts, done) {
  if('function' === typeof opts)
    done = opts, opts = null
  opts = opts || {}
  return pull(
    Map(function (e) {
      if(e.type) return e
      return {
        key   : e.key, 
        value : e.value,
        type  : e.value == null ? 'del' : 'put'
      }
    }),
    pw.recent(opts.windowSize, opts.windowTime),
    AsyncMap(function (batch, cb) {
      db.batch(batch, cb)
    }),
    Drain(null, done)
  )
}

