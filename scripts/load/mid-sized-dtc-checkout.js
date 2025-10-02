import { check, group, sleep } from "k6"
import http from "k6/http"

// let publishableKey = __ENV.K6_PUBLISHABLE_KEY
// let regionId = __ENV.K6_REGION_ID
// let endpoint = __ENV.K6_ENDPOINT
// let projectID = __ENV.K6_PROJECT_ID

const firstStageDuration = "2m"
const secondStageDuration = "6m"
const thirdStageDuration = "2m"

const highVus = 100
// const mediumVus = 50
const lowVus = 10

let publishableKey =
  "pk_937f7a595bd4b039bb6bbb95476dd036dd79187f31ef61cf7093f2b81a1f863b"
let regionId = "reg_01K4CCFRK54NSVCPVT0QP9J5QK"
let endpoint = "http://localhost:9000"

// let publishableKey =
//   "pk_937f7a595bd4b039bb6bbb95476dd036dd79187f31ef61cf7093f2b81a1f863b"
// let regionId = "reg_01K2ZDG12VKJ64F2NFTNW7Y8AT"
// let endpoint = "https://dtc-starter-preview.medusajs.app"
// let endpoint = "https://dtc-starter.medusajs.app"
// let projectId = 4475269

const params = {
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey,
  },
}

export const options = {
  //   cloud: {
  //     projectID: projectId,
  //     name: `Version 2.10.2, ${new Date().toLocaleString()} (local execution)`,
  // },
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
    randomShoppers: {
      executor: "ramping-vus",
      exec: "addToCart",
      startTime: "0s",
      stages: [
        { duration: firstStageDuration, target: lowVus },
        { duration: secondStageDuration, target: lowVus },
        { duration: thirdStageDuration, target: 0 },
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "randomShoppers" },
    },
  },
  thresholds: {
    "http_req_duration{scenario:browseCatalog}": ["p(95)<400"],
    "http_req_duration{scenario:addBrowseAddAbandon}": ["p(95)<700"],
    "http_req_duration{scenario:addBrowseAddComplete}": ["p(95)<1200"],
    "http_req_duration{scenario:addMultipleAbandon}": ["p(95)<700"],
    "http_req_duration{scenario:addMultipleComplete}": ["p(95)<1200"],
    "http_req_duration{scenario:randomShoppers}": ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
  },
}

// We only treat 5xx responses as errors, some 401 are expected
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 401 }))

export function browseCatalog() {
  return group("Browse Flow", () => {
    const [regionsRes] = http.batch([
      { method: "GET", url: `${endpoint}/store/regions`, params },
      { method: "GET", url: `${endpoint}/store/collections`, params },
      { method: "GET", url: `${endpoint}/store/product-categories`, params },
      { method: "GET", url: `${endpoint}/store/customers/me`, params },
    ])

    check(regionsRes, { "regions ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    const regions = JSON.parse(regionsRes.body).regions
    regionId = regions[Math.floor(Math.random() * regions.length)].id

    const productsParams = `region_id=${regionId}&fields=*variants.calculated_price&limit=20`

    let res = http.get(`${endpoint}/store/collections`, params)
    check(res, { "collections ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    res = http.get(`${endpoint}/store/products?${productsParams}`, params)
    check(res, { "products list ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    const products = JSON.parse(res.body).products

    res = http.get(`${endpoint}/store/products/${products[0].id}`, params)
    check(res, { "product details ok": (r) => r.status === 200 })
    sleep(2 + Math.random() * 3)

    return products
  })
}

function createCart() {
  const res = http.post(
    `${endpoint}/store/carts`,
    JSON.stringify({
      region_id: regionId,
    }),
    params
  )
  check(res, { "create cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function addItemToCart(cartId, variantId, quantity) {
  const res = http.post(
    `${endpoint}/store/carts/${cartId}/line-items`,
    JSON.stringify({
      variant_id: variantId,
      quantity: quantity,
    }),
    params
  )
  check(res, { "add to cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function viewCart(cartId) {
  const cartParams =
    "fields=*items,*region,*items.product,*items.variant,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name"
  const res = http.get(
    `${endpoint}/store/carts/${cartId}?${cartParams}`,
    params
  )
  check(res, { "view cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)
  return JSON.parse(res.body).cart
}

function applyPromotion(cartId) {
  if (Math.random() < 0.1) {
    const res = http.post(
      `${endpoint}/store/carts/${cartId}/promotions`,
      JSON.stringify({
        promo_codes: ["10OFF"],
      }),
      params
    )
    check(res, { "add promotion ok": (r) => r.status === 200 })
    sleep(1 + Math.random() * 2)
    return JSON.parse(res.body).cart
  }
  return null
}

function browseMoreProducts() {
  const productsParams = `region_id=${regionId}&fields=*variants.calculated_price&limit=20`
  const res = http.get(`${endpoint}/store/products?${productsParams}`, params)
  check(res, { "browse more products ok": (r) => r.status === 200 })
  sleep(3 + Math.random() * 4)
  return JSON.parse(res.body).products
}

function checkout(cart) {
  const [res, paymentProvidersResp, shippingOptionsResp] = http.batch([
    {
      method: "GET",
      url: `${endpoint}/store/carts/${cart.id}`,
      params,
    },
    {
      method: "GET",
      url: `${endpoint}/store/payment-providers?region_id=${regionId}`,
      params,
    },
    {
      method: "GET",
      url: `${endpoint}/store/shipping-options?cart_id=${cart.id}`,
      params,
    },
  ])
  check(res, { "view cart ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const selectedRegion = http.get(
    `${endpoint}/store/regions/${regionId}`,
    params
  )
  check(selectedRegion, { "selected region ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const country = JSON.parse(selectedRegion.body).region.countries[0].iso_2

  http.post(
    `${endpoint}/store/carts/${cart.id}`,
    JSON.stringify({
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
    params
  )
  sleep(Math.random() * 3)

  http.post(
    `${endpoint}/store/carts/${cart.id}/shipping-methods`,
    JSON.stringify({
      option_id: JSON.parse(shippingOptionsResp.body).shipping_options[0].id,
    }),
    params
  )
  sleep(Math.random() * 3)

  let paymentCollectionRes = http.post(
    `${endpoint}/store/payment-collections`,
    JSON.stringify({
      cart_id: cart.id,
    }),
    params
  )
  check(paymentCollectionRes, {
    "create payment collection ok": (r) => r.status === 200,
  })
  sleep(2 + Math.random() * 3)

  const paymentCollection = JSON.parse(
    paymentCollectionRes.body
  ).payment_collection

  let paymentSessionRes = http.post(
    `${endpoint}/store/payment-collections/${paymentCollection.id}/payment-sessions`,
    JSON.stringify({
      provider_id: JSON.parse(paymentProvidersResp.body).payment_providers[0]
        .id,
    }),
    params
  )
  check(paymentSessionRes, {
    "create payment session ok": (r) => r.status === 200,
  })
  sleep(2 + Math.random() * 3)

  let orderRes = http.post(
    `${endpoint}/store/carts/${cart.id}/complete`,
    JSON.stringify({}),
    params
  )
  check(orderRes, { "create order ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  const order = JSON.parse(orderRes.body).order
  sleep(Math.random() * 3)

  orderRes = http.get(`${endpoint}/store/orders/${order.id}`, params)
  check(orderRes, { "view order ok": (r) => r.status === 200 })
  sleep(2 + Math.random() * 3)

  return order
}

export function addBrowseAddAbandon() {
  return group("Shop Flow - Add Browse Add Abandon", () => {
    const products = browseCatalog()
    const cart = createCart()

    const firstProductIndex = Math.floor(Math.random() * products.length)
    addItemToCart(
      cart.id,
      products[firstProductIndex].variants[0].id,
      1 + Math.floor(Math.random() * 3),
      "first item"
    )

    const moreProducts = browseMoreProducts()

    const secondProductIndex = Math.floor(Math.random() * moreProducts.length)
    const updatedCart = addItemToCart(
      cart.id,
      moreProducts[secondProductIndex].variants[0].id,
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

    const firstProductIndex = Math.floor(Math.random() * products.length)
    addItemToCart(
      cart.id,
      products[firstProductIndex].variants[0].id,
      1 + Math.floor(Math.random() * 3),
      "first item"
    )

    const moreProducts = browseMoreProducts()

    const secondProductIndex = Math.floor(Math.random() * moreProducts.length)
    const updatedCart = addItemToCart(
      cart.id,
      moreProducts[secondProductIndex].variants[0].id,
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

    const numItems = 3 + Math.floor(Math.random() * 3)
    let updatedCart = cart

    for (let i = 0; i < numItems; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const quantity = 1 + Math.floor(Math.random() * 3)
      updatedCart = addItemToCart(
        cart.id,
        products[productIndex].variants[0].id,
        quantity,
        `item ${i + 1}`
      )
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

    const numItems = 3 + Math.floor(Math.random() * 3)
    let updatedCart = cart

    for (let i = 0; i < numItems; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const quantity = 1 + Math.floor(Math.random() * 3)
      updatedCart = addItemToCart(
        cart.id,
        products[productIndex].variants[0].id,
        quantity,
        `item ${i + 1}`
      )
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
