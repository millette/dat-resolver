'use strict'

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve
const http = require('http')

// npm
const Koa = require('koa')
const route = require('koa-route')
const cors = require('kcors')
const conditional = require('koa-conditional-get')
const etag = require('koa-etag')
const joi = require('joi')
const clivage = require('clivage')

const schema = joi.object({
  lru: joi.number().integer().default(15).optional(),
  port: joi.number().integer().default(3030).optional(),
  host: joi.string().default('127.0.0.1').optional(),
  fs: joi.boolean().truthy('').optional()
})

const cli = clivage(schema)

// self
const routes = require('./lib/routes')
const LRU = require(cli.flags.fs ? './lib/dat-lru-fs' : './lib/dat-lru')

const lru = new LRU(pathResolve(__dirname, 'dat-tests'), { max: cli.flags.lru, mkdirError: false })

const app = new Koa()
app.context.datLru = lru
app.context.cli = cli
app.use(conditional())
app.use(etag())
app.use(cors({ allowMethods: 'GET' }))
app.use(route.get('/resolve/:datkey', routes.datKeyM.bind(null, 'dat.json')))
app.use(route.get('/profile/:datkey', routes.datKeyM.bind(null, 'profile.json')))
app.use(route.get('/manifest/:datkey', routes.datKeyM.bind(null, 'manifest.json')))

if (cli.flags.fs) { app.use(route.get('/top/:datkey', routes.top)) }
app.use(route.get('/version/:datkey', routes.version))
app.use(route.get('/peers/:datkey', routes.peers))
app.use(route.get('/', routes.home))

// catch port in use error
http.createServer(app.callback())
  .on('error', (err) => { console.error(app.env === 'production' ? err.toString() : err) })
  .listen(cli.flags.port, cli.flags.host, function () { console.log('Ready!', this.address()) })
