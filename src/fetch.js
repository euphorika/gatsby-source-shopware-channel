const fetch = require("node-fetch")

module.exports = (host, accessKey) => {
  const headers = {
    "sw-access-key": accessKey,
  }

  return fetch(host, { headers: headers }).then(response => response.json())
}
