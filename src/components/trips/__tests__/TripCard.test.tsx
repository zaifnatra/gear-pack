import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TripCard } from '@/components/trips/TripCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/app/actions/weather', () => ({
  getTripWeather: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/app/actions/trips', () => ({
  updateTripImage: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/trips/InviteFriendModal', () => ({
  InviteFriendModal: () => null,
}))

vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: () => null,
}))

const baseTrip = {
  id: 'trip-1',
  name: 'PCT Section J',
  location: 'Sierra Nevada',
  startDate: new Date('2026-08-01'),
  endDate: new Date('2026-08-05'),
  type: 'MULTI_DAY',
  difficulty: 'HARD',
  distance: 50,
  elevationGain: 2000,
  organizerId: 'user-1',
  participants: [
    { user: { id: 'user-1', fullName: 'Jane Hiker', avatarUrl: null } },
  ],
  _count: { gearList: 3 },
}

describe('TripCard', () => {
  it('renders trip name and location', () => {
    render(<TripCard trip={baseTrip} currentUserId="user-1" />)
    expect(screen.getByText('PCT Section J')).toBeInTheDocument()
    expect(screen.getByText('Sierra Nevada')).toBeInTheDocument()
  })

  it('renders distance and elevation when provided', () => {
    render(<TripCard trip={baseTrip} currentUserId="user-1" />)
    expect(screen.getByText('50km')).toBeInTheDocument()
    expect(screen.getByText('2000m')).toBeInTheDocument()
  })

  it('shows dash when distance and elevation are null', () => {
    render(<TripCard trip={{ ...baseTrip, distance: null, elevationGain: null }} currentUserId="user-1" />)
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows "Invite Friends" button for the organizer', () => {
    render(<TripCard trip={baseTrip} currentUserId="user-1" />)
    expect(screen.getByText('Invite Friends')).toBeInTheDocument()
  })

  it('hides "Invite Friends" button for non-organizer', () => {
    render(<TripCard trip={baseTrip} currentUserId="other-user" />)
    expect(screen.queryByText('Invite Friends')).not.toBeInTheDocument()
  })

  it('renders the HARD difficulty badge', () => {
    render(<TripCard trip={baseTrip} currentUserId="user-1" />)
    expect(screen.getByText('HARD')).toBeInTheDocument()
  })

  it('renders the EASY difficulty badge', () => {
    render(<TripCard trip={{ ...baseTrip, difficulty: 'EASY' }} currentUserId="user-1" />)
    expect(screen.getByText('EASY')).toBeInTheDocument()
  })
})
