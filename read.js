var Live = require('pull-live')

var old = require('./old')
var live = require('./live')

module.exports = function (db, opts) {
  return Live(function (opts) {
    return old(db, opts)
  }, function (opts) {
    return live(db, opts)
  })(opts)
}
