'use strict'
import test from 'ava'
import { DatLru } from './'

test('acc', async t => {
  const lru = new DatLru('/tmp/false95959')
  const store = await lru.isReady()
  t.truthy(store)
})

test('bad', async t => {
  const lru = new DatLru('/tmp/false95959', { mkdirStrict: true })
  await t.throws(lru.isReady())
})
