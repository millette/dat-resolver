'use strict'

if (!util.promisify) { throw new Error('Requires node 8.x') }

// core
const util = require('util')

// npm
const Dat = util.promisify(require('dat-node'))
const parse = require('parse-dat-url')
const Koa = require('koa')
const route = require('koa-route')
const cors = require('kcors')

const DAT_HASH_REGEX = /^[a-z0-9]{64}$/i

const app = new Koa()

const vla = (ctx, datkey) => {
  const obj = parse(datkey)
  const key = obj.hostname

  if (!DAT_HASH_REGEX.test(key)) {
    return Promise.reject(new Error('datkey not found'))
  }

  return Dat('/tmp/temp-true999', { key, temp: false, sparse: true })
    .then((dat) => new Promise((resolve, reject) => {
      // or use callback and check for
      /*
      dat.joinNetwork(function (err) {
        if (err) throw err

        // After the first round of network checks, the callback is called
        // If no one is online, you can exit and let the user know.
        if (!dat.network.connected || !dat.network.connecting) {
          console.error('No users currently online for that key.')
          process.exit(1)
        }
      })
      */
      dat.joinNetwork().once('connection', () => resolve(dat))
      setTimeout(() => reject(new Error('Timeout')), 2000)
    }))
}

const top = (ctx, datkey) => {
  return vla(ctx, datkey)
    .then((dat) => util.promisify(dat.archive.readdir.bind(dat.archive))('/', { cached: true }))
    .then((files) => {
      ctx.body = { files }
    })
    .catch((e) => ctx.throw(404, e))
}

const datKeyM = (path, ctx, datkey) => {
  return vla(ctx, datkey)
    .then((dat) => {
      ctx.type = 'application/json'
      ctx.body = dat.archive.createReadStream(`/${path}`)
    })
    .catch((e) => ctx.throw(404, e))
}

app.use(cors({ allowMethods: 'GET' }))
app.use(route.get('/resolve/:datkey', datKeyM.bind(null, 'dat.json')))
app.use(route.get('/profile/:datkey', datKeyM.bind(null, 'profile.json')))
app.use(route.get('/top/:datkey', top))

app.listen(3030)
