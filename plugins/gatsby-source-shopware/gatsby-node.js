const fetch = require("node-fetch")

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions
  const headers = {
    "sw-access-key": configOptions.accessKey,
  }

  const apiUrl = `${configOptions.apiUrl}/sales-channel-api/v1/product`

  const processProduct = product => {
    const nodeId = createNodeId(`shopware-product-${product.id}`)
    const nodeContent = JSON.stringify(product)
    const nodeData = Object.assign({}, product, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `ShopwareProduct`,
        content: nodeContent,
        contentDigest: createContentDigest(product),
      },
    })
    return nodeData
  }

  return fetch(apiUrl, { headers: headers })
    .then(response => response.json())
    .then(products => {
      products.data.forEach(product => {
        const nodeData = processProduct(product)
        createNode(nodeData)
      })
    })
}
