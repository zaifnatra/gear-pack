import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FriendRequests } from '@/components/social/FriendRequests'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/app/actions/social', () => ({
  respondToFriendRequest: vi.fn().mockResolvedValue({ success: true }),
}))

const mockRequests = [
  {
    id: 'req-1',
    user: {
      id: 'user-2',
      username: 'janedoe',
      fullName: 'Jane Doe',
      avatarUrl: null,
    },
  },
]

describe('FriendRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no requests', () => {
    render(<FriendRequests requests={[]} />)
    expect(screen.getByText('No pending requests.')).toBeInTheDocument()
  })

  it('renders the sender full name and username', () => {
    render(<FriendRequests requests={mockRequests} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('@janedoe')).toBeInTheDocument()
  })

  it('renders initials avatar when avatarUrl is null', () => {
    render(<FriendRequests requests={mockRequests} />)
    expect(screen.getByText('JA')).toBeInTheDocument()
  })

  it('calls respondToFriendRequest with ACCEPTED when Accept is clicked', async () => {
    const { respondToFriendRequest } = await import('@/app/actions/social')
    render(<FriendRequests requests={mockRequests} />)
    fireEvent.click(screen.getByText('Accept'))
    await waitFor(() => {
      expect(respondToFriendRequest).toHaveBeenCalledWith('req-1', 'ACCEPTED')
    })
  })

  it('calls respondToFriendRequest with DECLINED when Decline is clicked', async () => {
    const { respondToFriendRequest } = await import('@/app/actions/social')
    render(<FriendRequests requests={mockRequests} />)
    fireEvent.click(screen.getByText('Decline'))
    await waitFor(() => {
      expect(respondToFriendRequest).toHaveBeenCalledWith('req-1', 'DECLINED')
    })
  })
})
