var pull = require('pull-stream')
var l    = require('../../')
var timestamp = require('monotonic-timestamp')

exports.random = 
function (db,  n, cb) {
  var all = []

  pull.infinite()
  .pipe(pull.map(function (e) {
    return {
      key: e.toString(),
      value: new Date().toString()
    }
  }))
  .pipe(pull.take(n))
  .pipe(pull.through(function (e) {
    all.push({key:e.key, value: e.value})
  }))
  .pipe(l.write(db, function (err) {
     cb(err, all)
  }))
}

exports.sort = function (all) {
  return all.sort(function (a, b) {
      return a.key === b.key ? 0 : a.key < b.key ? -1 : 1
    })
}


exports.words = function (db, cb) {
  var all
  pull.values(all = [
    {key: 'A', value: 'apple'},
    {key: 'B', value: 'banana'},
    {key: 'C', value: 'cherry'},
    {key: 'D', value: 'durian'},
    {key: 'E', value: 'elder-berry'},
  ])
  .pipe(l.write(db, function (err) {
    console.log('ALL', err, all)
    cb(err, all)
  }))
}


var ts = 0
exports.timestamps = function (db, n, cb) {
  var all = []
  pull.infinite()
  .pipe(pull.take(n))
  .pipe(pull.map(function (e) {
    return {
      key   : timestamp().toString(),
      value : e.toString()
    }
  }))
  .pipe(pull.through(function (e) {
    all.push({key:e.key, value: e.value})
  }))
  .pipe(l.write(db, function (err) {
     cb(err, all)
  }))

}
