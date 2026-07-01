'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const WaitlistSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
})

export interface WaitlistState {
    success: boolean
    message: string
    count: number
}

export async function getWaitlistCount() {
    try {
        return await prisma.waitlist.count()
    } catch (error) {
        console.error('Failed to get waitlist count:', error)
        return 0
    }
}

export async function joinWaitlist(_previousState: WaitlistState, formData: FormData): Promise<WaitlistState> {
    const parsed = WaitlistSchema.safeParse({
        email: formData.get('email'),
    })

    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.issues[0]?.message || 'Enter a valid email address',
            count: await getWaitlistCount(),
        }
    }

    try {
        await prisma.waitlist.create({
            data: {
                email: parsed.data.email,
            },
        })
        const count = await getWaitlistCount()
        revalidatePath('/waitlist')

        return {
            success: true,
            message: "You're on the waitlist.",
            count,
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {
                success: true,
                message: "You're already on the waitlist.",
                count: await getWaitlistCount(),
            }
        }

        console.error('Failed to join waitlist:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
            count: await getWaitlistCount(),
        }
    }
}
