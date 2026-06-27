import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GearForm } from '@/components/gear/GearForm'

vi.mock('@/app/actions/gear', () => ({
  createGearItem: vi.fn().mockResolvedValue({ success: true, data: { id: '1' } }),
  updateGearItem: vi.fn().mockResolvedValue({ success: true, data: { id: '1' } }),
  deleteGearItem: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/app/actions/categories', () => ({
  getCategories: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 'parent-1',
        name: 'Shelter',
        children: [{ id: 'child-1', name: 'Tent' }],
      },
    ],
  }),
}))

vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: ({ onUploadComplete }: { onUploadComplete: (url: string) => void }) => (
    <button type="button" onClick={() => onUploadComplete('https://example.com/img.jpg')}>
      Upload Image
    </button>
  ),
}))

describe('GearForm', () => {
  const onSuccess = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Item Name input', async () => {
    render(<GearForm userId="user-1" onSuccess={onSuccess} />)
    await screen.findByText('Tent')
    expect(screen.getByPlaceholderText('e.g. Zpacks Duplex')).toBeInTheDocument()
  })

  it('loads and renders categories from the action', async () => {
    render(<GearForm userId="user-1" onSuccess={onSuccess} />)
    expect(await screen.findByText('Tent')).toBeInTheDocument()
  })

  it('shows "Add to Closet" button when no initialData', async () => {
    render(<GearForm userId="user-1" onSuccess={onSuccess} />)
    await screen.findByText('Tent')
    expect(screen.getByText('Add to Closet')).toBeInTheDocument()
  })

  it('shows "Save Changes" and "Delete" button when editing', async () => {
    render(
      <GearForm
        userId="user-1"
        onSuccess={onSuccess}
        initialData={{
          id: 'gear-1',
          name: 'Old Tent',
          brand: '',
          weightGrams: 500,
          categoryId: 'child-1',
          condition: 'GOOD',
        }}
      />
    )
    await screen.findByText('Tent')
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls createGearItem with correct name on submit', async () => {
    const { createGearItem } = await import('@/app/actions/gear')
    render(<GearForm userId="user-1" onSuccess={onSuccess} />)

    await user.type(screen.getByPlaceholderText('e.g. Zpacks Duplex'), 'Zpacks Duplex')
    fireEvent.submit(screen.getByPlaceholderText('e.g. Zpacks Duplex').closest('form')!)

    await waitFor(() => {
      expect(createGearItem).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Zpacks Duplex' })
      )
    })
  })

  it('shows delete confirmation screen when Delete is clicked', async () => {
    render(
      <GearForm
        userId="user-1"
        onSuccess={onSuccess}
        initialData={{
          id: 'gear-1',
          name: 'My Tent',
          brand: '',
          weightGrams: 500,
          categoryId: 'child-1',
          condition: 'GOOD',
        }}
      />
    )
    fireEvent.click(screen.getByText('Delete'))
    expect(await screen.findByText(/Delete "My Tent"\?/)).toBeInTheDocument()
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument()
  })
})
