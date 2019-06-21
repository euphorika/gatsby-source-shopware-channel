const apiCall = require("./src/fetch")

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions
  const headers = {
    "sw-access-key": configOptions.accessKey,
  }
  const LIMIT = 500

  const productApiEndpoint = `${configOptions.host}/sales-channel-api/v1/product?limit=${LIMIT}`
  const categoryApiEndpoint = `${configOptions.host}/sales-channel-api/v1/category?sort=level&limit=${LIMIT}`

  const concatNodeId = (id, type) =>
    createNodeId(`shopware-${type.toLowerCase()}-${id}`)

  const processData = (data, type) => {
    const dataWithItemId = { ...data, itemId: data.id } // preserve ID field
    const nodeId = concatNodeId(data.id, type.toLowerCase())
    const nodeContent = JSON.stringify(dataWithItemId)
    const nodeData = Object.assign({}, dataWithItemId, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `Shopware${type}`,
        content: nodeContent,
        contentDigest: createContentDigest(dataWithItemId),
      },
    })

    return nodeData
  }

  const makeNode = (nodeData, type, callback = datum => datum) => {
    nodeData.forEach(datum => {
      datum = callback(datum)

      const nodeData = processData(datum, type)
      createNode(nodeData)
    })
  }

  return Promise.all([
    apiCall(productApiEndpoint, configOptions.accessKey),
    apiCall(categoryApiEndpoint, configOptions.accessKey),
  ]).then(responses => {
    const product = responses[0]
    const category = responses[1]

    let productsToCategory = {}

    makeNode(product.data, "Product", product => {
      if (product.categoryTree) {
        product.categoryTree.forEach(categoryId => {
          if (!productsToCategory[categoryId]) {
            productsToCategory[categoryId] = []
          }

          productsToCategory[categoryId].push(product)
        })
      }

      return product
    })

    makeNode(category.data, "Category", category => {
      const products = productsToCategory[category.id]

      if (products) {
        category.products = products
      }

      return category
    })
  })
}
