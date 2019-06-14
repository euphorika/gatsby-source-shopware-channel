const apiCall = require("./fetch")

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions
  const headers = {
    "sw-access-key": configOptions.accessKey,
  }

  const productApiEndpoint = `${configOptions.host}/sales-channel-api/v1/product`
  const categoryApiEndpoint = `${configOptions.host}/sales-channel-api/v1/category`

  const processData = (data, type) => {
    const nodeId = createNodeId(`shopware-product-${data.id}`)
    const nodeContent = JSON.stringify(data)
    const nodeData = Object.assign({}, data, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `Shopware${type}`,
        content: nodeContent,
        contentDigest: createContentDigest(data),
      },
    })

    return nodeData
  }

  const makeNode = (nodeData, type) => {
    nodeData.forEach(datum => {
      const nodeData = processData(datum, type)
      createNode(nodeData)
    })
  }

  return Promise.all([
    apiCall(productApiEndpoint, configOptions.accessKey),
    apiCall(categoryApiEndpoint, configOptions.accessKey),
  ]).then(responses => {
    product = responses[0]
    category = responses[1]

    makeNode(product.data, "Product")
    makeNode(category.data, "Category")
  })
}
