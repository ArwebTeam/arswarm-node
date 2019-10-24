'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = async ({ mongodb }) => {
  const txSchema = new Schema({
    _id: String,
    id: String,
    last_tx: String,
    owner: String,
    tags: Array,
    target: String,
    quantity: String,
    data: String,
    reward: String,
    signature: String
  })

  txSchema.index({ id: 1 })

  const tagSchema = new Schema({
    key: String,
    value: String,
    tx: String
  })

  tagSchema.index({ key: 1, value: -1 })

  const kvSchema = new Schema({
    _id: String,
    val: String
  })

  const objs = {
    TX: mongoose.model('tx', txSchema),
    Tag: mongoose.model('tag', tagSchema),
    KV: mongoose.model('kv', kvSchema)
  }

  return objs
}
