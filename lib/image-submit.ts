import { normalizeProductImages } from "@/lib/product-images"

export interface ResolveImageForSubmitArgs {
  existingImage: string
  selectedFile: File | null
  uploadFile: (file: File) => Promise<string>
}

export interface ResolveImagesForSubmitArgs {
  existingImages: string[]
  selectedFiles: Array<File | null>
  uploadFile: (file: File) => Promise<string>
}

export async function resolveImageForSubmit({
  existingImage,
  selectedFile,
  uploadFile,
}: ResolveImageForSubmitArgs): Promise<string | null> {
  if (selectedFile) {
    return uploadFile(selectedFile)
  }

  const trimmedImage = existingImage.trim()
  return trimmedImage.length > 0 ? trimmedImage : null
}

export async function resolveImagesForSubmit({
  existingImages,
  selectedFiles,
  uploadFile,
}: ResolveImagesForSubmitArgs): Promise<string[]> {
  const slotCount = Math.max(existingImages.length, selectedFiles.length)
  const resolvedImages: Array<string | null> = []

  for (let index = 0; index < slotCount; index += 1) {
    const selectedFile = selectedFiles[index] ?? null

    if (selectedFile) {
      resolvedImages.push(await uploadFile(selectedFile))
      continue
    }

    resolvedImages.push(existingImages[index] ?? null)
  }

  return normalizeProductImages(resolvedImages)
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as { error?: string; url?: string }

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Error al subir imagen")
  }

  return payload.url
}
