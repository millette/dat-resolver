'use strict'
import test from 'ava'
import { DatLru } from './'

const nop = () => Promise.resolve()

test('init', async t => {
  const lru = new DatLru('/tmp/false95959')
  const ready = await lru.isReady()
  t.truthy(ready)
})

test('not ready', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirStrict: true })
  await t.throws(lru.isReady())
})

test('bad key', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, 'abc1293')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'Invalid key')
})

test('init dat', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e5')
  const dat = await lru.isReady().then(nop).then(fn)
  t.truthy(dat && dat.archive)
})

test('dat not found', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirError: false })
  const fn = lru.get.bind(lru, '49bd045de3beb9abcb7272967e2fb16e07b96c06e15cd814f703e8581d4561e9')
  const dat = lru.isReady().then(nop).then(fn)
  await t.throws(dat, 'dat not found')
})
