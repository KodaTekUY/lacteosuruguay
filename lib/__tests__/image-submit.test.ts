import { describe, expect, it, vi } from "vitest"
import { resolveImageForSubmit, resolveImagesForSubmit } from "@/lib/image-submit"

describe("resolveImageForSubmit", () => {
  it("returns existing image url when no file is selected", async () => {
    const uploadFile = vi.fn()

    const result = await resolveImageForSubmit({
      existingImage: "https://cdn.example.com/a.png",
      selectedFile: null,
      uploadFile,
    })

    expect(result).toBe("https://cdn.example.com/a.png")
    expect(uploadFile).not.toHaveBeenCalled()
  })

  it("uploads selected file and returns uploaded url", async () => {
    const uploadedUrl = "https://cdn.example.com/new.png"
    const uploadFile = vi.fn().mockResolvedValue(uploadedUrl)
    const selectedFile = { name: "new.png" } as File

    const result = await resolveImageForSubmit({
      existingImage: "https://cdn.example.com/old.png",
      selectedFile,
      uploadFile,
    })

    expect(result).toBe(uploadedUrl)
    expect(uploadFile).toHaveBeenCalledTimes(1)
    expect(uploadFile).toHaveBeenCalledWith(selectedFile)
  })

  it("returns null when there is no selected file and existing image is empty", async () => {
    const uploadFile = vi.fn()

    const result = await resolveImageForSubmit({
      existingImage: "   ",
      selectedFile: null,
      uploadFile,
    })

    expect(result).toBeNull()
    expect(uploadFile).not.toHaveBeenCalled()
  })
})

describe("resolveImagesForSubmit", () => {
  it("resolves multiple image slots preserving their order", async () => {
    const uploadedUrl = "https://cdn.example.com/b.png"
    const uploadFile = vi.fn().mockResolvedValue(uploadedUrl)
    const selectedFile = { name: "b.png" } as File

    const result = await resolveImagesForSubmit({
      existingImages: [" https://cdn.example.com/a.png ", "", "https://cdn.example.com/c.png"],
      selectedFiles: [null, selectedFile, null],
      uploadFile,
    })

    expect(result).toEqual([
      "https://cdn.example.com/a.png",
      "https://cdn.example.com/b.png",
      "https://cdn.example.com/c.png",
    ])
    expect(uploadFile).toHaveBeenCalledTimes(1)
    expect(uploadFile).toHaveBeenCalledWith(selectedFile)
  })

  it("removes empty and duplicated image values", async () => {
    const uploadFile = vi.fn()

    const result = await resolveImagesForSubmit({
      existingImages: ["https://cdn.example.com/a.png", "   ", "https://cdn.example.com/a.png"],
      selectedFiles: [null, null, null],
      uploadFile,
    })

    expect(result).toEqual(["https://cdn.example.com/a.png"])
    expect(uploadFile).not.toHaveBeenCalled()
  })
})
