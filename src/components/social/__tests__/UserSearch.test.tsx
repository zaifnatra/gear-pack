import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserSearch } from '@/components/social/UserSearch'

vi.mock('@/app/actions/social', () => ({
  searchUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 'user-2', username: 'trailblazer', fullName: 'Bob Trail', avatarUrl: null },
    ],
  }),
  sendFriendRequest: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: () => null,
}))

describe('UserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', () => {
    render(<UserSearch currentUserId="user-1" />)
    expect(screen.getByPlaceholderText('Search by username or email...')).toBeInTheDocument()
  })

  it('shows no results initially', () => {
    render(<UserSearch currentUserId="user-1" />)
    expect(screen.queryByText('Bob Trail')).not.toBeInTheDocument()
  })

  it('shows search results after typing 2+ characters', async () => {
    render(<UserSearch currentUserId="user-1" />)
    fireEvent.change(
      screen.getByPlaceholderText('Search by username or email...'),
      { target: { value: 'bo' } }
    )
    expect(await screen.findByText('Bob Trail')).toBeInTheDocument()
    expect(screen.getByText('@trailblazer')).toBeInTheDocument()
  })

  it('clears results when query drops below 2 characters', async () => {
    render(<UserSearch currentUserId="user-1" />)
    const input = screen.getByPlaceholderText('Search by username or email...')

    fireEvent.change(input, { target: { value: 'bo' } })
    await screen.findByText('Bob Trail')

    fireEvent.change(input, { target: { value: 'b' } })
    await waitFor(() => {
      expect(screen.queryByText('Bob Trail')).not.toBeInTheDocument()
    })
  })

  it('calls sendFriendRequest and shows "Sent" label after clicking Add Friend', async () => {
    const { sendFriendRequest } = await import('@/app/actions/social')
    render(<UserSearch currentUserId="user-1" />)

    fireEvent.change(
      screen.getByPlaceholderText('Search by username or email...'),
      { target: { value: 'bo' } }
    )

    const addBtn = await screen.findByText('Add Friend')
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(sendFriendRequest).toHaveBeenCalledWith('user-1', 'user-2')
      expect(screen.getByText('Sent')).toBeInTheDocument()
    })
  })
})
