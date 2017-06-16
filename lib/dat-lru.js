'use strict'

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve
const mkdir = util.promisify(require('fs').mkdir)

// npm
const Dat = util.promisify(require('dat-node'))
const AsyncLRU = require('async-lru')

/*
// Fake Dat...
let n = 0

const Dat = (p, o) => new Promise((resolve, reject) => {
  ++n
  if (p === '/tmp/false999/abc1235') { return reject(new Error('bad dat')) }
  o.path = p
  console.log('DAT:', p, n, o)
  resolve(o)
})
*/

class DatLru extends AsyncLRU {
  constructor (path, opts) {
    opts = Object.assign({
      mkdirStrict: false, // implies mkdirError
      mkdirError: true,
      max: 2,
      temp: false,
      sparse: true
    }, opts)

    const max = opts.max
    const mkdirStrict = opts.mkdirStrict
    const mkdirError = opts.mkdirStrict || opts.mkdirError
    delete opts.max
    delete opts.mkdirError
    delete opts.mkdirStrict

    const load = DatLru.load(path, opts, mkdirError)

    super({ max, load })
    this.ready = null
    this.error = null
    this.get = util.promisify(AsyncLRU.prototype.get.bind(this))

    this.on('evict', (o) => {
      console.log('EVICT', o.key, o.value)
      this.emit('evict', o)
    })

    process.on('exit', this.exitHandler1.bind(this))
    process.on('SIGINT', this.exitHandler2.bind(this))
    process.on('uncaughtException', this.exitHandler2.bind(this))

    mkdir(path)
      .then(() => {
        this.ready = true
      })
      .catch((err) => {
        this.ready = (err.code === 'EEXIST') && !mkdirStrict
        if (!this.ready) { this.error = err }
      })
  }

  static load (path2, opts2, mkdirError2) {
    const mkJn = (dat) => util.promisify(dat.joinNetwork.bind(dat))

    return (key, cb) => {
      opts2.key = key
      const p = pathResolve(path2, key)
      const mkDat = () => Dat(p, opts2)
      const ret = (dat) => cb(null, dat)
      const fn = (err) => mkdirError2 ? cb(err) : Promise.resolve()
      const join = (dat) => {
        const jn = mkJn(dat)
        return jn()
          .then(() => (dat.network.connected && dat.network.connecting)
            ? dat
            : Promise.reject(new Error('dat not found')))
      }

      mkdir(p)
        .catch(fn)
        .then(mkDat)
        .then(join)
        .then(ret)
        .catch(cb)
    }
  }

  isReady (ms, t) {
    const now = Date.now()
    const err = new Error('Not ready')
    if (this.ready) { return Promise.resolve(0) }
    if (this.ready === false) { return Promise.reject(this.error || err) }
    if (!t || t <= 0) { t = 3 }
    if (!ms || ms <= 0) { ms = 1 }

    return new Promise((resolve, reject) => {
      const fn = (tries) => {
        if (this.ready) { return resolve(Date.now() - now) }
        if (this.ready === false) { return reject(this.error || err) }
        if (tries > 0) { return setTimeout(fn, ms, --tries) }
        return reject(this.error || err)
      }
      setTimeout(fn, ms, t)
    })
  }

  exitHandler1 (err) {
    console.log('clean', this.keys)
    if (err) { console.log(err.stack) }
  }

  exitHandler2 (err) {
    this.exitHandler1(err)
    process.exit()
  }
}

module.exports = DatLru
