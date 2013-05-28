
var levelup = require('level')
var pull    = require('pull-stream')

var path    = '/tmp/pull-level-read-stream'
require('rimraf').sync(path)
var db      = levelup(path)

var l = require('../')
var all = []
require('tape')('read-stream', function (t) {

  pull.infinite()
  .pipe(pull.map(function (e) {

//    throw new Error('wtf')
    return {
      key: e.toString(),
      value: new Date().toString()
    }
  }))
  .pipe(pull.take(20))
  .pipe(pull.through(function (e) {
    all.push({key:e.key, value: e.value})
  }))
  .pipe(l.write(db, function (err) {
    l.read(db)
    .pipe(pull.collect(function (err, ary) {
      t.equal(ary.length, all.length)
      t.deepEqual(ary, all.sort(function (a, b) {
        return Number(a.key) - Number(b.key)
      }))
      t.end()
    }))
  }))
})
