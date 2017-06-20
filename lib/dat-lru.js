'use strict'

const DAT_HASH_REGEX = /^[a-f0-9]{64}$/i

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve

// npm
const Dat = util.promisify(require('dat-node'))
const AsyncLRU = require('async-lru')
const parse = require('parse-dat-url')

class DatLru extends AsyncLRU {
  constructor (path, opts) {
    opts = Object.assign({
      max: 10,
      temp: true,
      sparse: true
    }, opts)

    super({ max: opts.max, load: DatLru.load(path, opts) })
    this.get = util.promisify(AsyncLRU.prototype.get.bind(this))
  }

  static load (path2, opts2) {
    const mkJn = (dat) => util.promisify(dat.joinNetwork.bind(dat))
    return (datkey, cb) => {
      const obj = parse(datkey)
      const key = obj.hostname
      if (!DAT_HASH_REGEX.test(key)) { return cb(new Error('invalid dat key')) }
      opts2.key = key
      const p = pathResolve(path2, key)
      const ret = (dat) => cb(null, dat)
      const join = (dat) => {
        const jn = mkJn(dat)
        return jn({ utp: false, upload: false })
          .then(() => {
            if (dat.network && (dat.network.connected || dat.network.connecting)) { return dat }
            return Promise.reject(new Error('dat not found'))
          })
      }

      Dat(p, opts2)
        .then(join)
        .then(ret)
        .catch(cb)
    }
  }

  async isReady () { return true }

  async cleanup () { return 'ok-nothing' }
}

module.exports = DatLru
