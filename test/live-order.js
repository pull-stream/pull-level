
var levelup  = require('level')
//var SubLevel = require('level-sublevel')
var pull     = require('pull-stream')


var l = require('../')
var all = []

var h = require('./helper')
var tape = require('tape')

tape('live', function (t) {

  var path    = '/tmp/pull-level-read-live'
  require('rimraf').sync(path)
  var db      = levelup(path)

  var second = false

  h.timestamps(db, 10, function (err, all) {

    var i = 0
    var sync = false
    pull(
      l.read(db, {tail: true, onSync: function () {
        console.log('SYNC')
        sync = true
      }}),
      h.exactly(20),
      pull.collect(function (err, ary) {
        process.nextTick(function () {
          t.notOk(err)
          t.ok(second)
          console.log("ALL", all)
          t.equal(ary.length, 20)
          t.equal(ary.length, all.length)
          t.deepEqual(ary, h.sort(ary.slice()))
          t.deepEqual(ary.map(function (e) {
            return {key: e.key, value: e.value}
          }), all)
          t.ok(sync)
          t.end()
        })
      })
    )


    setTimeout(function () {
      h.timestamps(db, 10, function (err, _all) {
        second = true
        all = all.concat(_all)
        console.log('all', all, all.length)
      })
    }, 100)
  })
})


tape('live2', function (t) {

  var path    = '/tmp/pull-level-read-live2'
  require('rimraf').sync(path)
  var db      = levelup(path)

  var second = false

  h.timestamps(db, 10, function (err, all) {

    var i = 0
    var sync = false
    pull(
      l.read(db, {tail: true, keys: false, onSync: function () {
        console.log('SYNC')
        sync = true
      }}),
      h.exactly(20),
      pull.collect(function (err, ary) {
        process.nextTick(function () {
          t.notOk(err)
          t.ok(second)
          console.log(ary)
          t.equal(ary.length, 20)
          t.equal(ary.length, all.length)

          var values = all.map(function (e) { return e.value })

          t.deepEqual(ary, values)
          t.ok(sync)
          t.end()
        })
      })
    )


    setTimeout(function () {
      h.timestamps(db, 10, function (err, _all) {
        second = true
        all = all.concat(_all)
//        console.log('all', all, all.length)
      })
    }, 100)
  })
})

