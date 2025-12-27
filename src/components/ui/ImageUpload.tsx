'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
    onUploadComplete: (url: string) => void
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const { error } = await supabase.storage
                .from('gear')
                .upload(filePath, file)

            if (error) {
                throw error
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('gear')
                .getPublicUrl(filePath)

            onUploadComplete(data.publicUrl)
        } catch (error: any) {
            console.error('Error uploading image:', error)
            alert(error.message || 'Error uploading image!')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className={`relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all 
        ${previewUrl ? 'border-emerald-500 bg-black' : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'}`}
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center text-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        <span className="text-xs mt-1">Upload</span>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />

                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                )}
            </div>

        </div>
    )
}
