'use strict'

const datKeyM = (path, ctx, key) => ctx.datLru.get(key)
  .then((dat) => {
    ctx.etag = `version-${dat.version}`
    ctx.type = 'application/json'
    ctx.body = dat.archive.createReadStream(`/${path}`)
  })
  .catch((e) => ctx.throw(404, e))

const top = (ctx, key) => ctx.datLru.get(key)
  .then((dat) => {
    ctx.etag = `version-${dat.version}`
    return dat.archive.readdir('/')
  })
  .then((files) => {
    ctx.type = 'application/json'
    ctx.body = { files }
  })
  .catch((e) => ctx.throw(404, e))

module.exports = { top, datKeyM }
