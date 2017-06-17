'use strict'
import test from 'ava'
import { DatLru } from './'

const nop = () => Promise.resolve()

test('init', async t => {
  const lru = new DatLru('/tmp/false95959')
  const ready = await lru.isReady()
  t.truthy(ready)
})

test('bad dir', async t => {
  const lru = new DatLru('/tmp6/false95959')
  await t.throws(lru.isReady(), / ENOENT: /)
})

test('not ready', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirStrict: true })
  await t.throws(lru.isReady(), / EEXIST: /)
})

test('bad key', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, 'abc1293')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'invalid dat key')
})

test('init dat', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat = await lru.isReady().then(nop).then(fn)
  t.truthy(dat && dat.archive)
})

test('readdir dat', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat = await lru.isReady().then(nop).then(fn)
  const files = await dat.archive.readdir('/')
  t.truthy(dat && dat.archive)
  t.is(files.length, 9)
})

test('init 2 dats', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat1 = await lru.isReady().then(nop).then(fn)
  const dat2 = await fn()
  t.truthy(dat1 && dat1.archive)
  t.truthy(dat2 && dat2.archive)
})

test('dat eviction', async t => {
  t.plan(7)
  const max = 2
  const k1 = '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5'
  const lru = new DatLru('/tmp/false95959', { max, mkdirError: false })
  lru.on('dat-evict', (o) => {
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
  t.truthy(dat1 && dat1.archive)
  t.truthy(dat2 && dat2.archive)
  t.truthy(dat3 && dat3.archive)
  t.truthy(dat4 && dat4.archive)
})

test('dat not found', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e9')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'dat not found')
})
