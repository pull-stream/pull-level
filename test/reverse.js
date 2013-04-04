var levelup  = require('levelup')
var SubLevel = require('level-sublevel')
var pull     = require('pull-stream')

var path    = '/tmp/pull-level-read-reverse'
require('rimraf').sync(path)
var db      = SubLevel(levelup(path))

var l = require('../')
var all = []

var h = require('./helper')

var test = require('tape')

function filter(range) {
  require('tape')('ranges:' + JSON.stringify(range), 
  function (t) {

    l.read(db, {reverse: true})
    .pipe(pull.collect(function (err, ary) {
      t.notOk(err)
      t.equal(ary.length, all.length)
      t.deepEqual(h.sort(ary), all.filter(function (e) {
        return (
          (!range.min || range.min <= e.key) && 
          (!range.max || range.max >= e.key)
        )
      }))
      t.end()
    }))
  })
}

require('tape')('reverse', function (t) {

  var second = false

  h.words(db, function (err, all) {

    t.notOk(err)
    var i = 0
/*
    db.createReadStream({reverse: true})
      .on('data', console.log)
      .on('end', function () {
        console.log('END')
      })
//*/
/**/
    l.read(db, {reverse: true})
    .pipe(pull.collect(function (err, ary) {
      t.notOk(err)
      t.equal(ary.length, all.length)
      t.deepEqual(ary, all.reverse())
//      t.deepEqual(ary, h.sort(ary.slice()))
      t.end()
    }))
//*/
    /*
    h.timestamps(db, 10, function (err, _all) {
      second = true
      all = all.concat(_all)
    })
    */
  })
})
