'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateProfile } from '@/app/dashboard/profile/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ProfileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(50).optional().or(z.literal("")),
    bio: z.string().max(300, "Bio must be less than 300 characters").optional().or(z.literal("")),
    avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof ProfileSchema>

interface ProfileFormProps {
    initialData: {
        fullName: string | null
        bio: string | null
        avatarUrl: string | null
        username: string
    }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, setIsPending] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            fullName: initialData.fullName || '',
            bio: initialData.bio || '',
            avatarUrl: initialData.avatarUrl || '',
        },
    })

    const avatarUrl = watch('avatarUrl')

    async function onImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setValue('avatarUrl', publicUrl)
            toast.success('Image uploaded successfully')
        } catch (error) {
            console.error(error)
            toast.error('Failed to upload image')
        } finally {
            setIsUploading(false)
        }
    }

    async function onSubmit(data: ProfileFormValues) {
        setIsPending(true)
        try {
            const result = await updateProfile(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profile updated successfully')
                router.refresh()
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
            {/* Avatar Preview & Upload */}
            <div className="flex items-center gap-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="avatar-upload"
                        className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isUploading ? 'Uploading...' : 'Change Avatar'}
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onImageUpload}
                            disabled={isUploading}
                        />
                    </label>
                    <p className="text-xs text-neutral-500">JPG, GIF or PNG. Max 2MB.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                </label>
                <input
                    value={initialData.username}
                    readOnly
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed focus:outline-none dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400"
                />
                <p className="text-[10px] text-neutral-500">Usernames cannot be changed.</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name
                </label>
                <input
                    {...register('fullName')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50"
                    placeholder="Your Name"
                />
                {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bio
                </label>
                <textarea
                    {...register('bio')}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50"
                    placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                    <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
            </div>

            {/* Hidden Input for Form Submission compliance if needed, or just let useForm handle it via setValue */}
            <input type="hidden" {...register('avatarUrl')} />

            <div className="flex justify-start border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                    {isPending ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </form>
    )
}
