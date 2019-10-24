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
      await TX.create(data)
    },
    del: async (id) => {
      if (!txCache.has(id) && !(await TX.findOne({ _id: id }))) {
        return
      }

      txCache.deleteMany(id)

      await Tag.deleteMany({ filter: { tx: id } })
      await TX.deleteMany({ filter: { _id: id } })
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
        await KV.deleteMany({ _id: key })
        await KV.create({ _id: key, val })
      },
      get: async (key) => {
        const res = await KV.findOne({ _id: key })
        if (res) {
          return res.val
        }
      }
    }
  }

  C.arql = await ARQL(C)

  return C
}
