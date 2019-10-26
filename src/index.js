'use strict'

const Swarm = require('arswarm/src/swarm')
const Cache = require('./cache')

module.exports = async (config, arweave) => {
  const cache = await Cache(config.cache)
  const swarm = await Swarm(config.swarm, cache)

  swarm.node.peer().addrs.forEach(addr => {
    console.log('Listening on %s', addr)
  })
}
