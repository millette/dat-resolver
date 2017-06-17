'use strict'

const DAT_HASH_REGEX = /^[a-z0-9]{64}$/i

// npm
const parse = require('parse-dat-url')

const vla = (ctx, datkey) => {
  const obj = parse(datkey)
  const key = obj.hostname
  if (!DAT_HASH_REGEX.test(key)) { return Promise.reject(new Error('datkey not found')) }
  return ctx.datLru.get(key)
}

const datKeyM = (path, ctx, datkey) => {
  return vla(ctx, datkey)
    .then((dat) => {
      ctx.etag = `version-${dat.version}`
      ctx.type = 'application/json'
      ctx.body = dat.archive.createReadStream(`/${path}`)
    })
    .catch((e) => ctx.throw(404, e))
}

const top = (ctx, datkey) => {
  return vla(ctx, datkey)
    .then((dat) => {
      ctx.etag = `version-${dat.version}`
      return dat.archive.readdir('/')
    })
    .then((files) => {
      ctx.type = 'application/json'
      ctx.body = { files }
    })
    .catch((e) => ctx.throw(404, e))
}

module.exports = { top, datKeyM }
