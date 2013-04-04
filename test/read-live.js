
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

  h.random(db, 10, function (err, all) {

    l.read(db, {tail: true})
    .pipe(pull.take(20))
    .pipe(pull.collect(function (err, ary) {
      t.notOk(err)
      t.ok(second)
      console.log(ary)
      t.equal(ary.length, all.length)
      t.deepEqual(h.sort(ary), all)
      t.end()
    }))

    h.random(db, 10, function (err, _all) {
      second = true
      all = h.sort(all.concat(_all))
    })
     
  })
}) 
