var indy = require('indy-sdk')

var helpers = {}
helpers.waitUntilApplied = async function waitUntilApplied (ph, req, cond) {
    for (let i = 0; i < 3; i++) {
      let res = await indy.submitRequest(ph, req)
  
      if (cond(res)) {
        return res
      }
  
      await sleep(5 * 1000)
    }
  }

module.exports = helpers