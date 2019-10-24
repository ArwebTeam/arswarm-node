'use strict'

const Swarm = require('../swarm')
const Cache = require('./cache')

module.exports = async (config, arweave) => {
  const cache = await Cache(config.cache)
  const swarm = await Swarm(config.swarm, cache)

  swarm._node.peerInfo.multiaddrs.toArray().map(String).forEach(addr => {
    console.log('Listening on %s', addr)
  })
}
