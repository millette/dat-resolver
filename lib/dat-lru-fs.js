'use strict'

const DAT_HASH_REGEX = /^[a-f0-9]{64}$/i

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve
const mkdir = util.promisify(require('fs').mkdir)

// npm
const Dat = util.promisify(require('dat-node'))
const AsyncLRU = require('async-lru')
const parse = require('parse-dat-url')
const rimraf = util.promisify(require('rimraf'))

// extend dat-lru (mem-only) instead of AsyncLRU
// bad idea... see ```hier``` branch
class DatLruFs extends AsyncLRU {
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

    super({ max, load: DatLruFs.load(path, opts, mkdirError) })
    this.ready = null
    this.error = null
    this.get = util.promisify(AsyncLRU.prototype.get.bind(this))

    this.on('evict', (o) => {
      DatLruFs.cleanDat(o.value)
        .then(() => {
          // emit('evict') creates an infinite loop
          this.emit('evict-fs', o)
        })
        .catch(console.error)
    })

    mkdir(path)
      .then(() => { this.ready = true })
      .catch((err) => {
        this.ready = (err.code === 'EEXIST') && !mkdirStrict
        if (!this.ready) { this.error = err }
      })
  }

  static cleanDat (dat) {
    dat.leaveNetwork()
    return rimraf(dat.path, { glob: false })
  }

  static load (path2, opts2, mkdirError2) {
    const mkJn = (dat) => util.promisify(dat.joinNetwork.bind(dat))
    return (datkey, cb) => {
      const obj = parse(datkey)
      const key = obj.hostname
      if (!DAT_HASH_REGEX.test(key)) { return cb(new Error('invalid dat key')) }
      opts2.key = key
      const p = pathResolve(path2, key)
      const mkDat = () => Dat(p, opts2)
      const ret = (dat) => cb(null, dat)
      const fn = (err) => mkdirError2 ? cb(err) : Promise.resolve()
      const join = (dat) => {
        const jn = mkJn(dat)
        return jn({ utp: false, upload: false })
          .then(() => {
            if (dat.network.connected && dat.network.connecting) { return dat }
            return DatLruFs.cleanDat(dat)
              .then(() => Promise.reject(new Error('dat not found')))
          })
          .then((dat) => {
            dat.archive.readdir = util.promisify(dat.archive.readdir.bind(dat.archive))
            return dat
          })
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
        reject(this.error || err) // never reached accoring to nyc
      }
      setTimeout(fn, ms, t)
    })
  }

  cleanup () {
    if (!this.keys.length) { return Promise.resolve('ok-nothing') }
    const ps = []
    this.keys.forEach((k) => { ps.push(this.get(k).then(DatLruFs.cleanDat)) })
    return Promise.all(ps)
      .then((x) => 'ok-' + x.length)
      .catch(console.error)
  }
}

module.exports = DatLruFs
