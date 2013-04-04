
var levelup  = require('levelup')
var SubLevel = require('level-sublevel')
var pull     = require('pull-stream')

var path    = '/tmp/pull-level-read-live'
require('rimraf').sync(path)
var db      = SubLevel(levelup(path))

var l = require('../')
var all = []

var h = require('./helper')

require('tape')('live', function (t) {

  var second = false

  h.timestamps(db, 10, function (err, all) {

    var i = 0

    l.read(db, {tail: true})
    .pipe(pull.take(20))
    .pipe(pull.asyncMap(function (e, cb) {
      setTimeout(function () {
        cb(null, e)
      }, 5)
    }))
    .pipe(pull.through(function (e) {
        console.log(e, i++)
      }))
    .pipe(pull.collect(function (err, ary) {
      t.notOk(err)
      t.ok(second)
      t.equal(ary.length, all.length)
      t.equal(ary.length, 20)
      t.deepEqual(ary, all)
      t.deepEqual(ary, h.sort(ary.slice()))
      t.end()
    }))

    h.timestamps(db, 10, function (err, _all) {
      second = true
      all = all.concat(_all)
    })
     
  })
})
