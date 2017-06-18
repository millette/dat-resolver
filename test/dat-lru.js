'use strict'

import test from 'ava'
import DatLru from '../lib/dat-lru'

const nop = () => Promise.resolve()

test('init', async t => {
  const lru = new DatLru('/tmp/mem95959-z')
  const ready = await lru.isReady()
  t.truthy(ready)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

/*
test('bad dir', async t => {
  const lru = new DatLru('/tmp6/false95959-z')
  await t.throws(lru.isReady(), / ENOENT: /)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('not ready', async t => {
  const lru = new DatLru('/tmp/mem95959-z', { mkdirStrict: true })
  await t.throws(lru.isReady(), / EEXIST: /)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})
*/

test('bad key', async t => {
  const lru = new DatLru('/tmp/mem95959-x')
  const fn = lru.get.bind(lru, 'abc1293')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'invalid dat key')
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('cleanup init dat', async t => {
  const lru = new DatLru('/tmp/mem95959-w')
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat = await lru.isReady().then(nop).then(fn)
  t.truthy(dat && dat.archive)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

/*
test('readdir dat', async t => {
  const lru = new DatLru('/tmp/mem95959-a')
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat = await lru.isReady().then(nop).then(fn)
  const files = await dat.archive.readdir('/')
  t.truthy(dat && dat.archive)
  t.is(files.length, 9)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})
*/

test('init dat twice', async t => {
  const lru = new DatLru('/tmp/mem95959-b')
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat1 = await lru.isReady().then(nop).then(fn)
  const dat2 = await fn()
  t.truthy(dat1 && dat1.archive)
  t.truthy(dat2 && dat2.archive)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('init 2 dats', async t => {
  const lru = new DatLru('/tmp/mem95959-c')
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat1 = await lru.isReady().then(nop).then(fn)
  const dat2 = await lru.get('d62aa262608e6ccfa81364764632265668a7046f25206d3ded8480f14e8b7c42')
  t.truthy(dat1 && dat1.archive)
  t.truthy(dat2 && dat2.archive)
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('dat eviction', async t => {
  t.plan(8)
  const max = 2
  const k1 = '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5'
  const lru = new DatLru('/tmp/mem95959-d', { max }) // , mkdirError: false
  lru.on('evict', (o) => {
    t.is(lru.keys.length, max) // default lru size (max) is 2
    t.is(o.key, k1)
    t.is(typeof o.value, 'object')
  })
  const fn = lru.get.bind(lru, k1)
  const dat1 = await lru.isReady().then(nop).then(fn)
  const dat2 = await fn()
  const dat3 = await lru.get('d62aa262608e6ccfa81364764632265668a7046f25206d3ded8480f14e8b7c42')
  // evict on 3rd
  const dat4 = await lru.get('c5d64071c632d706e07e4ab0b8f39c2af80aa07605ef73bc4c130110744e49d8')

  // allow some time for the evict event to happen
  const p = new Promise((resolve, reject) => {
    setTimeout(() => {
      t.truthy(dat1 && dat1.archive)
      t.truthy(dat2 && dat2.archive)
      t.truthy(dat3 && dat3.archive)
      t.truthy(dat4 && dat4.archive)
      resolve()
    }, 1000)
  })
  await p
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('dat eviction cleanup', async t => {
  t.plan(6)
  const max = 1
  const k1 = '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5'
  const lru = new DatLru('/tmp/mem95959-e', { max }) // , mkdirError: false
  lru.on('evict', (o) => {
    t.is(lru.keys.length, max)
    t.is(o.key, k1)
    t.is(typeof o.value, 'object')
  })
  const fn = lru.get.bind(lru, k1)
  const dat1 = await lru.isReady().then(nop).then(fn)
  // evict on 2nd
  const dat2 = await lru.get('d62aa262608e6ccfa81364764632265668a7046f25206d3ded8480f14e8b7c42')

  // allow some time for the evict event to happen
  const p = new Promise((resolve, reject) => {
    setTimeout(() => {
      t.truthy(dat1 && dat1.archive)
      t.truthy(dat2 && dat2.archive)
      resolve()
    }, 1000)
  })
  await p
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})

test('dat not found', async t => {
  const lru = new DatLru('/tmp/mem95959-f')
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e0')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'dat not found')
  const x = await lru.cleanup()
  t.is(x, 'ok-nothing')
})
