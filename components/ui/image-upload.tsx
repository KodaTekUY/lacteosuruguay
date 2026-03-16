"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value: string
  file: File | null
  onChange: (url: string) => void
  onFileChange: (file: File | null) => void
  placeholder?: string
  className?: string
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function ImageUpload({
  value,
  file,
  onChange,
  onFileChange,
  placeholder = "Selecciona una imagen",
  className,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl)
      }
    }
  }, [filePreviewUrl])

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return "Formato invalido. Solo se permite JPEG, PNG, GIF o WebP"
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "El archivo supera el maximo de 10MB"
    }

    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onFileChange(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) {
      setError("Por favor, arrastra solo archivos de imagen")
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onFileChange(file)
  }

  const handleClear = () => {
    onFileChange(null)
    onChange("")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{placeholder}</p>
          {(value || file) && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
          `}
        >
          {filePreviewUrl || value ? (
            <div className="relative w-full h-32 mx-auto">
              <Image
                src={filePreviewUrl || value}
                alt="Preview"
                fill
                className="object-contain rounded"
                onError={() => setError("No se pudo cargar la imagen")}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm">Arrastra una imagen o haz clic para seleccionar</p>
              <p className="text-xs">JPEG, PNG, GIF, WebP (max. 10MB)</p>
            </div>
          )}
        </div>

        {file && <p className="text-xs text-muted-foreground">Archivo seleccionado: {file.name}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
