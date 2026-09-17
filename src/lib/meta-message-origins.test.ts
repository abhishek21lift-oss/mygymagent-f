import { isAllowedMetaMessageOrigin } from "./meta-message-origins"

describe("isAllowedMetaMessageOrigin", () => {
  it("accepts the Meta signup origins", () => {
    expect(isAllowedMetaMessageOrigin("https://www.facebook.com")).toBe(true)
    expect(isAllowedMetaMessageOrigin("https://web.facebook.com")).toBe(true)
    expect(isAllowedMetaMessageOrigin("https://m.facebook.com")).toBe(true)
  })

  it("rejects lookalike and non-Meta origins", () => {
    expect(isAllowedMetaMessageOrigin("https://evilfacebook.com")).toBe(false)
    expect(isAllowedMetaMessageOrigin("https://www.facebook.com.evil.com")).toBe(false)
    expect(isAllowedMetaMessageOrigin("https://facebook.com")).toBe(false)
    expect(isAllowedMetaMessageOrigin("")).toBe(false)
    expect(isAllowedMetaMessageOrigin("null")).toBe(false)
  })
})
