import { pluralize } from "../pluralize"

describe("pluralize", function () {
  it("should pluralize any words", function () {
    const words = [
      "apple",
      "box",
      "day",
      "country",
      "baby",
      "knife",
      "hero",
      "potato",
      "address",
      "info",
      "rice",
      "price",
    ]

    const expectedOutput = [
      "apples",
      "boxes",
      "days",
      "countries",
      "babies",
      "knives",
      "heroes",
      "potatoes",
      "addresses",
      "info",
      "rice",
      "prices",
    ]

    words.forEach((word, index) => {
      expect(pluralize(word)).toBe(expectedOutput[index])
    })
  })
})
