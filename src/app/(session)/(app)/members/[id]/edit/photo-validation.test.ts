import "@testing-library/jest-dom"

import { PROFILE_PHOTO_MAX_BYTES, validateProfilePhoto } from "./photo-validation"

function fileOf(bytes: number[], name: string, type: string, size?: number): File {
  const blob = new Blob([new Uint8Array(bytes)], { type })
  const file = new File([blob], name, { type })
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size })
  }
  return file
}

describe("validateProfilePhoto", () => {
  it("accepts JPEG, PNG and WebP by magic bytes, not extension", async () => {
    const jpeg = fileOf([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0], "evil.exe", "application/octet-stream")
    const png = fileOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0], "photo.png", "image/png")
    const webp = fileOf(
      [0x52, 0x49, 0x46, 0x46, 0x01, 0x02, 0x03, 0x04, 0x57, 0x45, 0x42, 0x50],
      "photo.webp",
      "image/webp",
    )
    await expect(validateProfilePhoto(jpeg)).resolves.toBeNull()
    await expect(validateProfilePhoto(png)).resolves.toBeNull()
    await expect(validateProfilePhoto(webp)).resolves.toBeNull()
  })

  it("rejects a renamed text file", async () => {
    const text = fileOf(
      [0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21],
      "photo.jpg",
      "image/jpeg",
    )
    await expect(validateProfilePhoto(text)).resolves.toMatch(/JPEG, PNG or WebP/)
  })

  it("rejects oversized and empty files", async () => {
    const big = fileOf([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0], "big.jpg", "image/jpeg", PROFILE_PHOTO_MAX_BYTES + 1)
    await expect(validateProfilePhoto(big)).resolves.toMatch(/10 MB/)
    const empty = fileOf([], "empty.jpg", "image/jpeg")
    await expect(validateProfilePhoto(empty)).resolves.toMatch(/empty/)
  })
})
