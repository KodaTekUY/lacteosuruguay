import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth"

// Sirv API configuration
const SIRV_API_URL = "https://api.sirv.com/v2"

interface SirvTokenResponse {
  token: string
  expiresIn: number
}

// Cache token to avoid requesting a new one for each upload
let cachedToken: { token: string; expiresAt: number } | null = null

async function getSirvToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const clientId = process.env.SIRV_CLIENT_ID
  const clientSecret = process.env.SIRV_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Sirv credentials not configured. Please set SIRV_CLIENT_ID and SIRV_CLIENT_SECRET environment variables.")
  }

  const response = await fetch(`${SIRV_API_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Sirv token: ${error}`)
  }

  const data: SirvTokenResponse = await response.json()
  
  // Cache the token
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (data.expiresIn * 1000),
  }

  return data.token
}

async function uploadToSirv(fileBlob: Blob, filename: string, contentType: string): Promise<string> {
  const token = await getSirvToken()
  const sirvAccount = process.env.SIRV_ACCOUNT || "default"
  
  // Create a unique filename to avoid collisions
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = filename.split('.').pop() || 'jpg'
  const cleanName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-')
  const uniqueFilename = `${cleanName}-${timestamp}-${randomStr}.${ext}`
  
  // Upload path in Sirv
  const uploadPath = `/uploads/${uniqueFilename}`

  const response = await fetch(`${SIRV_API_URL}/files/upload?filename=${encodeURIComponent(uploadPath)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: fileBlob,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to Sirv: ${error}`)
  }

  // Return the public URL
  // Sirv URLs are typically: https://[account].sirv.com/[path]
  return `https://${sirvAccount}.sirv.com${uploadPath}`
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth()
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    // Convert file to Blob for upload
    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes], { type: file.type })

    // Upload to Sirv
    const imageUrl = await uploadToSirv(blob, file.name, file.type)

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
