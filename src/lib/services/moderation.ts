import { prisma } from '@/lib/prisma'
import { ReportTargetType } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * UGC moderation minimums for App Store guideline 1.2: users must be able
 * to report objectionable content and block abusive users. Reports are
 * reviewed manually (no admin UI yet); blocking reuses the Friendship
 * BLOCKED status, which also removes the pair from each other's search
 * results and friend lists.
 */

export async function createReport(reporterId: string, input: {
    targetType: ReportTargetType
    targetId: string
    reason: string
}) {
    try {
        const { allowed } = checkRateLimit(`report:${reporterId}`, 10, 24 * 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You have submitted too many reports recently. Please try again later.' }
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                targetType: input.targetType,
                targetId: input.targetId,
                reason: input.reason,
            }
        })

        return { success: true, data: { id: report.id } }
    } catch (error) {
        console.error('Failed to create report:', error)
        return { success: false, error: 'Failed to submit report' }
    }
}

export async function blockUser(blockerId: string, targetId: string) {
    try {
        if (blockerId === targetId) {
            return { success: false, error: 'You cannot block yourself' }
        }

        const target = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true }
        })

        if (!target) {
            return { success: false, error: 'User not found' }
        }

        // Replace any existing relationship (friendship, pending request)
        // with a single BLOCKED edge owned by the blocker
        await prisma.$transaction([
            prisma.friendship.deleteMany({
                where: {
                    OR: [
                        { userId: blockerId, friendId: targetId },
                        { userId: targetId, friendId: blockerId }
                    ]
                }
            }),
            prisma.friendship.create({
                data: {
                    userId: blockerId,
                    friendId: targetId,
                    status: 'BLOCKED'
                }
            })
        ])

        return { success: true }
    } catch (error) {
        console.error('Failed to block user:', error)
        return { success: false, error: 'Failed to block user' }
    }
}

export async function unblockUser(blockerId: string, targetId: string) {
    try {
        await prisma.friendship.deleteMany({
            where: {
                userId: blockerId,
                friendId: targetId,
                status: 'BLOCKED'
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to unblock user:', error)
        return { success: false, error: 'Failed to unblock user' }
    }
}
