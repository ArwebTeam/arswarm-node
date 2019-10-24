'use strict'

const Transaction = require('arweave/web/lib/transaction').default
const DB = require('./storage')

const ARQL = require('arswarm/src/arqlLocalExecutor')

module.exports = async ({ mongodb }) => {
  const txCache = new Map()
  const { Tag, TX, KV } = await DB({ mongodb })

  const C = {
    add: async (data) => {
      if (txCache.has(data.id)) {
        return
      }

      if (await TX.findOne({ _id: data.id })) {
        return
      }

      const tx = new Transaction(data)

      const bulk = []
      tx.get('tags').forEach((tag) => {
        const key = tag.get('name')
        const value = tag.get('value')

        bulk.push({ insertOne: { key, value, tx: data.id } })
      })
      await Tag.bulkWrite(bulk)

      txCache.set(data.id, tx)
      data._id = data.id
      await TX.insertOne(data)
    },
    del: async (id) => {
      if (!txCache.has(id) && !(await TX.findOne({ _id: id }))) {
        return
      }

      txCache.delete(id)

      await Tag.delete({ filter: { tx: id } })
      await TX.delete({ filter: { _id: id } })
    },
    get: async (id) => {
      if (txCache.has(id)) {
        return txCache.get(id)
      }

      let data
      if ((data = await TX.findOne({ _id: id }))) {
        const tx = new Transaction(data)
        txCache.set(id, tx)
        return tx
      }

      throw new Error('TX not found')
    },
    getKVTags: async (key, value) => {
      const res = await Tag.find({ key, value })
      return res.map(r => r.tx)
    },
    batchAdd: async (txs) => {
      await Promise.all(txs.map(C.add))
    },
    kv: {
      set: async (key, val) => {
        await KV.delete({ _id: key })
        await KV.insertOne({ _id: key, val })
      },
      get: async (key) => {
        return KV.findOne({ _id: key })
      }
    }
  }

  C.arql = await ARQL(C)

  return C
}
