
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
    .pipe(function (read) {
      return function (abort, cb) {
        read(abort, function (end, data) {
          cb(end, data)
        })
      }
    })
    .pipe(pull.through(function (e) {
      console.log('>>>', e, ++i)
    }, function () {
      console.log("END")
    }))
    .pipe(pull.take(20, true))
    .pipe(pull.collect(function (err, ary) {
      process.nextTick(function () {
        t.notOk(err)
        t.ok(second)
        console.log(all)
        t.equal(ary.length, 20)
        t.equal(ary.length, all.length)
        t.deepEqual(ary, h.sort(ary.slice()))
        t.deepEqual(ary.map(function (e) {
          return {key: e.key, value: e.value}
        }), all)
        t.end()
      })
    }))


    setTimeout(function () {
      h.timestamps(db, 10, function (err, _all) {
        second = true
        all = all.concat(_all)
        console.log('all', all, all.length)
      })
    }, 100)
  })
})
