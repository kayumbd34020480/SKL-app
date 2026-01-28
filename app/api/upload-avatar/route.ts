import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 500 * 1024 // 500KB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const oldAvatarUrl = formData.get('oldAvatarUrl') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 500KB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Delete old avatar if exists
    if (oldAvatarUrl && oldAvatarUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(oldAvatarUrl)
      } catch {
        // Ignore deletion errors for old avatar
      }
    }

    // Create unique filename
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `avatars/${userId}-${Date.now()}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
