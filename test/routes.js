'use strict'

import test from 'ava'
import routes from '../lib/routes'

test('init', async t => {
  const createReadStream = (path) => 'hithereiamastream'
  const get = (key) => key.length === 64
    ? Promise.resolve({ archive: { createReadStream } })
    : Promise.reject(new Error('invalid dat key'))

  const throwFn = function (code, err) {
    this.threw = { code, err }
    return Promise.reject(err)
  }

  const ctx = { datLru: { get } }
  ctx.throw = throwFn.bind(ctx)

  await routes.datKeyM('dat.json', ctx, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')

  t.is(ctx.type, 'application/json')
  t.is(ctx.body, 'hithereiamastream')
})

test('bad key', async t => {
  const createReadStream = (path) => 'hithereiamastream'
  const get = (key) => key.length === 64
    ? Promise.resolve({ archive: { createReadStream } })
    : Promise.reject(new Error('invalid dat key'))

  const throwFn = function (code, err) {
    this.threw = { code, err }
    return Promise.reject(err)
  }

  const ctx = { datLru: { get } }
  ctx.throw = throwFn.bind(ctx)

  const dat = routes.datKeyM('dat.json', ctx, '49bd04...4561e5')
  await t.throws(dat, 'invalid dat key')
})

test('top', async t => {
  const readdir = (path) => Promise.resolve(['/profile.json', '/dat.json'])
  const get = (key) => key.length === 64
    ? Promise.resolve({ archive: { readdir } })
    : Promise.reject(new Error('invalid dat key'))

  const throwFn = function (code, err) {
    this.threw = { code, err }
    return Promise.reject(err)
  }

  const ctx = { datLru: { get } }
  ctx.throw = throwFn.bind(ctx)

  await routes.top(ctx, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')

  t.is(ctx.type, 'application/json')
  t.is(typeof ctx.body, 'object')
  t.is(typeof ctx.body.files, 'object')
  t.is(ctx.body.files.length, 2)
})

test('top bad key', async t => {
  const readdir = (path) => Promise.resolve(['/profile.json', '/dat.json'])
  const get = (key) => key.length === 64
    ? Promise.resolve({ archive: { readdir } })
    : Promise.reject(new Error('invalid dat key'))

  const throwFn = function (code, err) {
    this.threw = { code, err }
    return Promise.reject(err)
  }

  const ctx = { datLru: { get } }
  ctx.throw = throwFn.bind(ctx)

  const dat = routes.top(ctx, '49bd04...4561e5')
  await t.throws(dat, 'invalid dat key')
})
