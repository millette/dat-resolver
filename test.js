'use strict'
import test from 'ava'
import { DatLru } from './'

test('acc', async t => {
  const lru = new DatLru('/tmp/false95959') // , { mkdirError: false }
  const store = await lru.isReady()
  t.truthy(store)

/*
  const p = new Promise((resolve, reject) => {
    resolve('ok')
  })

  let store = await p
  t.is(store, 'ok')
*/
})
