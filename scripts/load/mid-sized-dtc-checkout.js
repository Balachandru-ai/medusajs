import { check, group, sleep } from "k6"
import http from "k6/http"

/**
 * NOTE: if running high VUs (eg. 450) locally lead to errors such as: "connect: can't assign requested
 * address". It means that the number of port available is not enough for the number of concurrent
 * connections. You can increase the number of ports available by running the following command:
 *
 * On MAC OS:
 * you can expand the range with:
 *   sudo sysctl net.inet.ip.portrange.first=10000
 *   sudo sysctl net.inet.ip.portrange.last=65535
 * Verify the range with:
 *   sysctl net.inet.ip.portrange.first net.inet.ip.portrange.last
 * Reset to defaults
 *   sudo sysctl net.inet.ip.portrange.first=49152
 *   sudo sysctl net.inet.ip.portrange.last=65535
 */

// let publishableKey = __ENV.K6_PUBLISHABLE_KEY
// let regionId = __ENV.K6_REGION_ID
// let endpoint = __ENV.K6_ENDPOINT
// let projectID = __ENV.K6_PROJECT_ID

const thresholds = {
  "http_req_duration{scenario:browseCatalog}": ["p(95)<400"],
  "http_req_duration{scenario:addBrowseAddAbandon}": ["p(95)<700"],
  "http_req_duration{scenario:addBrowseAddComplete}": ["p(95)<1200"],
  "http_req_duration{scenario:addMultipleAbandon}": ["p(95)<700"],
  "http_req_duration{scenario:addMultipleComplete}": ["p(95)<1200"],
  http_req_failed: ["rate<0.01"],
}

const firstStageDuration = "2m"
const secondStageDuration = "6m"
const thirdStageDuration = "2m"

const highVus = 300
const lowVus = 30

const promoApplicationRate = 0.1 // 10% of users apply promo codes
const minItemsInCart = 3
const maxItemsInCart = 5

/** LOCAL TESTING */
// let publishableKey =
//   "pk_03823fccbc94952c4e2a6d045adb1b3479389ccacef6e4d5198c5e7b2a9dc4b5"
// let regionId = "reg_01K4JKNGBA9HXBS57EJFSXY2X7"
// let endpoint = "http://localhost:9000"

/** TESTING WITH K6 CLOUD */
let publishableKey =
  "pk_937f7a595bd4b039bb6bbb95476dd036dd79187f31ef61cf7093f2b81a1f863b"
let regionId = "reg_01K2ZDG12VKJ64F2NFTNW7Y8AT"
// let endpoint = "https://dtc-starter-preview.medusajs.app"
let endpoint = "https://dtc-starter.medusajs.app"
let projectId = 4837050

const params = {
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey,
  },
}

export const options = {
  cloud: {
    projectID: projectId,
    name: `Version 2.10.1, ${new Date().toLocaleString()}`,
  },
  scenarios: {
    browseCatalog: {
      executor: "ramping-vus",
      exec: "browseCatalog",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: highVus },
        { duration: secondStageDuration, target: highVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "browseCatalog" },
    },
    addBrowseAddAbandon: {
      executor: "ramping-vus",
      exec: "addBrowseAddAbandon",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: lowVus },
        { duration: secondStageDuration, target: lowVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "addBrowseAddAbandon" },
    },
    addBrowseAddComplete: {
      executor: "ramping-vus",
      exec: "addBrowseAddComplete",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: lowVus },
        { duration: secondStageDuration, target: lowVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "addBrowseAddComplete" },
    },
    addMultipleAbandon: {
      executor: "ramping-vus",
      exec: "addMultipleAbandon",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: lowVus },
        { duration: secondStageDuration, target: lowVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "addMultipleAbandon" },
    },
    addMultipleComplete: {
      executor: "ramping-vus",
      exec: "addMultipleComplete",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: lowVus },
        { duration: secondStageDuration, target: lowVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "addMultipleComplete" },
    },
    // randomShoppers: {
    //   executor: "ramping-vus",
    //   exec: "addToCart",
    //   startTime: "0s",
    //   stages: [
    //     { duration: firstStageDuration, target: lowVus },
    //     { duration: secondStageDuration, target: lowVus },
    //     { duration: thirdStageDuration, target: 0 },
    //   ],
    //   gracefulRampDown: "30s",
    //   tags: { scenario: "randomShoppers" },
    // },
  },
  thresholds: thresholds,
}

// We only treat 5xx, 400 responses as errors, some 401 are expected
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 401))

// Helper function to group URLs by pattern to reduce time series
function makeRequest({ method, url, body, urlPattern } = {}) {
  const requestParams = {
    ...params,
    tags: {
      name: urlPattern || url, // Use pattern for grouping
    },
  }

  if (method === "GET") {
    return http.get(url, requestParams)
  } else if (method === "POST") {
    return http.post(url, body, requestParams)
  }
  return http.request(method, url, body, requestParams)
}

function makePostRequest({ url, body, urlPattern } = {}) {
  return makeRequest({
    method: "POST",
    url,
    body,
    urlPattern,
  })
}

function makeGetRequest({ url, urlPattern } = {}) {
  return makeRequest({
    method: "GET",
    url,
    urlPattern,
  })
}

export function browseCatalog() {
  return group("Browse Flow", () => {
    const [regionsRes] = http.batch([
      {
        method: "GET",
        url: `${endpoint}/store/regions`,
        params: { ...params, tags: { name: `${endpoint}/store/regions` } },
      },
      {
        method: "GET",
        url: `${endpoint}/store/collections`,
        params: { ...params, tags: { name: `${endpoint}/store/collections` } },
      },
      {
        method: "GET",
        url: `${endpoint}/store/product-categories`,
        params: {
          ...params,
          tags: { name: `${endpoint}/store/product-categories` },
        },
      },
      {
        method: "GET",
        url: `${endpoint}/store/customers/me`,
        params: { ...params, tags: { name: `${endpoint}/store/customers/me` } },
      },
    ])

    check(regionsRes, { "regions ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    const regions = JSON.parse(regionsRes.body).regions
    regionId = regions[Math.floor(Math.random() * regions.length)].id

    const productsParams = `region_id=${regionId}&fields=*variants.calculated_price&limit=20`

    let res = makeGetRequest({
      url: `${endpoint}/store/collections`,
    })

    check(res, { "collections ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    res = makeGetRequest({
      url: `${endpoint}/store/products?${productsParams}`,
    })

    check(res, { "products list ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    const products = JSON.parse(res.body).products
    if (!products.length) {
      return []
    }

    res = makeGetRequest({
      url: `${endpoint}/store/products/${products[0].id}`,
      urlPattern: `${endpoint}/store/products/:id`,
    })

    check(res, { "product details ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    return products
  })
}

function createCart() {
  const res = makePostRequest({
    url: `${endpoint}/store/carts`,
    body: JSON.stringify({
      region_id: regionId,
    }),
  })

  check(res, { "create cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function addItemToCart(cartId, variantId, quantity) {
  const res = makePostRequest({
    url: `${endpoint}/store/carts/${cartId}/line-items`,
    body: JSON.stringify({
      variant_id: variantId,
      quantity: quantity,
    }),
    urlPattern: `${endpoint}/store/carts/:id/line-items`,
  })

  check(res, { "add to cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function viewCart(cartId) {
  const cartParams =
    "fields=*items,*region,*items.product,*items.variant,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name"

  const res = makeGetRequest({
    url: `${endpoint}/store/carts/${cartId}?${cartParams}`,
    urlPattern: `${endpoint}/store/carts/:id?${cartParams}`,
  })

  check(res, { "view cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function applyPromotion(cartId) {
  if (Math.random() < promoApplicationRate) {
    const res = makePostRequest({
      url: `${endpoint}/store/carts/${cartId}/promotions`,
      body: JSON.stringify({
        promo_codes: ["10OFF"],
      }),
      urlPattern: `${endpoint}/store/carts/:id/promotions`,
    })

    check(res, { "add promotion ok": (r) => r.status === 200 })
    sleep(1 + Math.random() * 2)
    return JSON.parse(res.body).cart
  }
  return null
}

function browseMoreProducts() {
  const productsParams = `region_id=${regionId}&fields=*variants.calculated_price&limit=20`
  const res = makeGetRequest({
    url: `${endpoint}/store/products?${productsParams}`,
  })

  check(res, { "browse more products ok": (r) => r.status === 200 })
  sleep(3 + Math.random() * 4)
  const products = JSON.parse(res.body).products
  if (!products.length) {
    return []
  }
  return products
}

function checkout(cart) {
  const [res, paymentProvidersResp, shippingOptionsResp] = http.batch([
    {
      method: "GET",
      url: `${endpoint}/store/carts/${cart.id}`,
      params: { ...params, tags: { name: `${endpoint}/store/carts/:id` } },
    },
    {
      method: "GET",
      url: `${endpoint}/store/payment-providers?region_id=${regionId}`,
      params: {
        ...params,
        tags: { name: `${endpoint}/store/payment-providers?region_id` },
      },
    },
    {
      method: "GET",
      url: `${endpoint}/store/shipping-options?cart_id=${cart.id}`,
      params: {
        ...params,
        tags: { name: `${endpoint}/store/shipping-options?cart_id` },
      },
    },
  ])

  check(res, { "view cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const selectedRegion = makeGetRequest({
    url: `${endpoint}/store/regions/${regionId}`,
    urlPattern: `${endpoint}/store/regions/:id`,
  })

  check(selectedRegion, { "selected region ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const country = JSON.parse(selectedRegion.body).region.countries[0].iso_2

  const updateCartRes = makePostRequest({
    url: `${endpoint}/store/carts/${cart.id}`,
    body: JSON.stringify({
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_1: "Some street.",
        address_2: "Some alley",
        company: "ACME",
        postal_code: "13456",
        city: "Wonderland",
        country_code: country,
        province: "QC",
        phone: "1234567",
      },
      email: "john.doe@example.com",
    }),
    urlPattern: `${endpoint}/store/carts/:id`,
  })

  check(updateCartRes, {
    "update cart with address ok": (r) => r.status === 200,
  })
  sleep(Math.random() * 3)

  const shippingOptions = JSON.parse(shippingOptionsResp.body).shipping_options
  if (!shippingOptions.length) {
    throw new Error("No shipping options available")
  }

  const addShippingMethodRes = makePostRequest({
    url: `${endpoint}/store/carts/${cart.id}/shipping-methods`,
    body: JSON.stringify({
      option_id: shippingOptions[0].id,
    }),
    urlPattern: `${endpoint}/store/carts/:id/shipping-methods`,
  })

  check(addShippingMethodRes, {
    "add shipping method ok": (r) => r.status === 200,
  })
  sleep(Math.random() * 3)

  let paymentCollectionRes = makePostRequest({
    url: `${endpoint}/store/payment-collections`,
    body: JSON.stringify({
      cart_id: cart.id,
    }),
  })

  check(paymentCollectionRes, {
    "create payment collection ok": (r) => r.status === 200,
  })
  sleep(2 + Math.random() * 3)

  const paymentCollection = JSON.parse(
    paymentCollectionRes.body
  ).payment_collection

  const paymentProviders = JSON.parse(
    paymentProvidersResp.body
  ).payment_providers
  if (!paymentProviders.length) {
    throw new Error("No payment providers available")
  }

  let paymentSessionRes = makePostRequest({
    url: `${endpoint}/store/payment-collections/${paymentCollection.id}/payment-sessions`,
    body: JSON.stringify({
      provider_id: paymentProviders[0].id,
    }),
    urlPattern: `${endpoint}/store/payment-collections/:id/payment-sessions`,
  })

  check(paymentSessionRes, {
    "create payment session ok": (r) => r.status === 200,
  })
  sleep(2 + Math.random() * 3)

  let orderRes = makePostRequest({
    url: `${endpoint}/store/carts/${cart.id}/complete`,
    body: JSON.stringify({}),
    urlPattern: `${endpoint}/store/carts/:id/complete`,
  })

  check(orderRes, { "create order ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const order = JSON.parse(orderRes.body).order
  sleep(Math.random() * 3)

  orderRes = makeGetRequest({
    url: `${endpoint}/store/orders/${order.id}`,
    urlPattern: `${endpoint}/store/orders/:id`,
  })

  check(orderRes, { "view order ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  return order
}

export function addBrowseAddAbandon() {
  return group("Shop Flow - Add Browse Add Abandon", () => {
    const products = browseCatalog()
    if (!products.length) {
      return []
    }

    const cart = createCart()

    const firstProductIndex = Math.floor(Math.random() * products.length)
    const product = products[firstProductIndex]
    const variantId =
      product &&
      product.variants &&
      product.variants[0] &&
      product.variants[0].id
    if (!variantId) {
      return []
    }

    addItemToCart(
      cart.id,
      variantId,
      1 + Math.floor(Math.random() * 3),
      "first item"
    )

    const moreProducts = browseMoreProducts()
    if (!moreProducts.length) {
      return []
    }

    const secondProductIndex = Math.floor(Math.random() * moreProducts.length)
    const secondProduct = moreProducts[secondProductIndex]
    const secondVariantId =
      secondProduct &&
      secondProduct.variants &&
      secondProduct.variants[0] &&
      secondProduct.variants[0].id
    if (!secondVariantId) {
      return []
    }

    const updatedCart = addItemToCart(
      cart.id,
      secondVariantId,
      1 + Math.floor(Math.random() * 2),
      "second item"
    )

    viewCart(updatedCart.id)
    const finalCart = applyPromotion(updatedCart.id) || updatedCart

    return finalCart
  })
}

export function addBrowseAddComplete() {
  return group("Shop Flow - Add Browse Add Complete", () => {
    const products = browseCatalog()
    const cart = createCart()

    if (!products.length) {
      return []
    }

    const firstProductIndex = Math.floor(Math.random() * products.length)
    const product = products[firstProductIndex]
    const variantId =
      product &&
      product.variants &&
      product.variants[0] &&
      product.variants[0].id
    if (!variantId) {
      return []
    }

    addItemToCart(
      cart.id,
      variantId,
      1 + Math.floor(Math.random() * 3),
      "first item"
    )

    const moreProducts = browseMoreProducts()
    if (!moreProducts.length) {
      return []
    }

    const secondProductIndex = Math.floor(Math.random() * moreProducts.length)
    const secondProduct = moreProducts[secondProductIndex]
    const secondVariantId =
      secondProduct &&
      secondProduct.variants &&
      secondProduct.variants[0] &&
      secondProduct.variants[0].id
    if (!secondVariantId) {
      return []
    }

    const updatedCart = addItemToCart(
      cart.id,
      secondVariantId,
      1 + Math.floor(Math.random() * 2),
      "second item"
    )

    viewCart(updatedCart.id)
    const finalCart = applyPromotion(updatedCart.id) || updatedCart

    return checkout(finalCart)
  })
}

export function addMultipleAbandon() {
  return group("Shop Flow - Add Multiple Abandon", () => {
    const products = browseCatalog()
    const cart = createCart()

    if (!products.length) {
      return []
    }

    const numItems =
      minItemsInCart +
      Math.floor(Math.random() * (maxItemsInCart - minItemsInCart + 1))
    let updatedCart = cart

    for (let i = 0; i < numItems; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const quantity = 1 + Math.floor(Math.random() * 3)

      const product = products[productIndex]
      const variantId =
        product &&
        product.variants &&
        product.variants[0] &&
        product.variants[0].id
      if (!variantId) {
        return []
      }

      updatedCart = addItemToCart(cart.id, variantId, quantity, `item ${i + 1}`)
    }

    viewCart(updatedCart.id)
    const finalCart = applyPromotion(updatedCart.id) || updatedCart

    return finalCart
  })
}

export function addMultipleComplete() {
  return group("Shop Flow - Add Multiple Complete", () => {
    const products = browseCatalog()
    const cart = createCart()

    if (!products.length) {
      return []
    }

    const numItems =
      minItemsInCart +
      Math.floor(Math.random() * (maxItemsInCart - minItemsInCart + 1))
    let updatedCart = cart

    for (let i = 0; i < numItems; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const quantity = 1 + Math.floor(Math.random() * 3)

      const product = products[productIndex]
      const variantId =
        product &&
        product.variants &&
        product.variants[0] &&
        product.variants[0].id
      if (!variantId) {
        return []
      }

      updatedCart = addItemToCart(cart.id, variantId, quantity, `item ${i + 1}`)
    }

    viewCart(updatedCart.id)
    const finalCart = applyPromotion(updatedCart.id) || updatedCart

    return checkout(finalCart)
  })
}

export function addToCart() {
  const scenario = Math.random()

  if (scenario < 0.25) {
    return addBrowseAddAbandon()
  } else if (scenario < 0.5) {
    return addBrowseAddComplete()
  } else if (scenario < 0.75) {
    return addMultipleAbandon()
  } else {
    return addMultipleComplete()
  }
}

export function completeCart() {
  const scenario = Math.random()

  if (scenario < 0.5) {
    return addBrowseAddComplete()
  } else {
    return addMultipleComplete()
  }
}
