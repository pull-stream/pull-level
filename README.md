# pull-level

[pull-stream](https://github.com/dominictarr/pull-stream) interface to
[levelup](https://github.com/rvagg/node-levelup)

## Example - reading

read items in database.

``` js
var pl = require('pull-level')
var pull = require('pull-stream')

var db = require('levelup')('/tmp/pull-level-example')

pl.read(db)
  .pipe(pull.collect(console.log))
```

read items in database, plus realtime changes

``` js
pl.read(db, {tail: true})
  //log data as it comes,
  //because tail will keep the connection open
  //so we'll never see the end otherwise.
  .pipe(pull.through(console.log))
  //note, pull-streams will not drain unless something is
  //pulling the data through, so we have to add drain
  //even though the data we want is coming from pull.through()
  .pipe(pull.drain())
```

If you just want the realtime inserts,
use `live`

``` js
pl.live(db, {tail: true})
  .pipe(pull.through(console.log))
  .pipe(pull.drain())
```

## Example - writing

To write, pipe batch changes into `write`

``` js
pull.values([
  {key: 0, value: 'zero', type: 'put'},
  {key: 1, value: 'one',  type: 'put'},
  {key: 2, value: 'two',  type: 'put'},
]).pipe(pl.write(db))
```

If you are lazy/busy, you can leave off `type`.
In that case, if `value` is non-null, the change
is considered a `put` else, a `del`.

``` js
pull.values([
  {key: 0, value: 'zero'},
  {key: 1, value: 'one'},
  {key: 2, value: 'two'},
]).pipe(pl.write(db))
```


## Example - indexes!

With pull-level it's easy to create indexes.
just save a pointer to the key.

like this:
``` js
pull.values([
  {key: key, value: VALUE, type: 'put'},
  {key: '~INDEX~' + VALUE.prop, value: key,  type: 'put'},
]).pipe(pl.write(db))
```

then, when you want to do a `read`, use `asyncMap`

``` js
pl.read(db, {min: '~INDEX~', max: '~INDEX~~'})
  .pipe(pull.asyncMap(function (e, cb) {
    db.get(e.value, function (value) {
      cb(null, {key: e.value, value: value})
    })
  })
  .pipe(pull.collect(console.log))
```

## License

MIT
