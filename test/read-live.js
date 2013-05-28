
var levelup  = require('level')
var SubLevel = require('level-sublevel')
var pull     = require('pull-stream')

var path    = '/tmp/pull-level-read-live'
require('rimraf').sync(path)
var db      = SubLevel(levelup(path))

var l = require('../')
var all = []

var h = require('./helper')

require('tape')('live', function (t) {

  var second = false, sync

  h.random(db, 10, function (err, all) {

    l.read(db, {tail: true, onSync: function () {
      console.log('sync')
      sync = true
    }})
    .pipe(function (read) { //it's like pull.take(), but check BEFORE reading
      var n = 20
      return function (a, cb) {
        if(n--)
          read(a, cb)
        else
          cb(true)
      }
    })
    .pipe(pull.map(function (e) {
      return {key: e.key, value: e.value}//drop 'type' from live updates
    }))
    .pipe(pull.collect(function (err, ary) {
      t.notOk(err)
      t.ok(second)
      console.log(ary)
      console.log(all)
      console.log(ary.length, all.length)
      t.equal(ary.length, all.length)
      t.deepEqual(h.sort(ary), all)
      t.ok(sync)
      t.end()
    }))

    h.random(db, 10, function (err, _all) {
      second = true
      all = h.sort(all.concat(_all))
    })
     
  })
}) 
