'use strict'

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve

// self
// const { DatLru, routes } = require('./')
const DatLru = require('./lib/dat-lru')
const routes = require('./lib/routes')

// npm
const Koa = require('koa')
const route = require('koa-route')
const cors = require('kcors')
const conditional = require('koa-conditional-get')
const etag = require('koa-etag')

const app = new Koa()

const lru = new DatLru(pathResolve(__dirname, 'dat-tests'), { max: 15, mkdirError: false })
app.context.datLru = lru

app.use(conditional())
app.use(etag())
app.use(cors({ allowMethods: 'GET' }))
app.use(route.get('/resolve/:datkey', routes.datKeyM.bind(null, 'dat.json')))
app.use(route.get('/profile/:datkey', routes.datKeyM.bind(null, 'profile.json')))
app.use(route.get('/manifest/:datkey', routes.datKeyM.bind(null, 'manifest.json')))
if (DatLru.cleanDat) {
  app.use(route.get('/top/:datkey', routes.top))
}
app.use(route.get('/version/:datkey', routes.version))
app.use(route.get('/peers/:datkey', routes.peers))
app.use(route.get('/', routes.home))
app.listen(3030)

console.log('app.env:', app.env)
