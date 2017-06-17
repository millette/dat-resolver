'use strict'

// core
const util = require('util')
if (!util.promisify) { throw new Error('Requires node 8.x') }
const pathResolve = require('path').resolve

// self
const { DatLru, routes } = require('./')

// npm
const Koa = require('koa')
const route = require('koa-route')
const cors = require('kcors')
const conditional = require('koa-conditional-get')
const etag = require('koa-etag')

const app = new Koa()

app.context.datLru = new DatLru(pathResolve(__dirname, 'dat-tests'), { mkdirError: false })

app.use(conditional())
app.use(etag())
app.use(cors({ allowMethods: 'GET' }))
app.use(route.get('/resolve/:datkey', routes.datKeyM.bind(null, 'dat.json')))
app.use(route.get('/profile/:datkey', routes.datKeyM.bind(null, 'profile.json')))
app.use(route.get('/top/:datkey', routes.top))
app.listen(3030)
