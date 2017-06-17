'use strict'

const DAT_HASH_REGEX = /^[a-z0-9]{64}$/i

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve

// self
const { DatLru } = require('./')

// npm
const parse = require('parse-dat-url')
const Koa = require('koa')
const route = require('koa-route')
const cors = require('kcors')

const app = new Koa()

app.context.datLru = new DatLru(pathResolve(__dirname, 'dat-tests'), { mkdirError: false })

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

app.use(cors({ allowMethods: 'GET' }))
app.use(route.get('/resolve/:datkey', datKeyM.bind(null, 'dat.json')))
app.use(route.get('/profile/:datkey', datKeyM.bind(null, 'profile.json')))
app.use(route.get('/top/:datkey', top))

app.listen(3030)
