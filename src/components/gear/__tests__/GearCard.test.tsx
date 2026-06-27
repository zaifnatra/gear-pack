import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GearCard } from '@/components/gear/GearCard'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/constants/category-images', () => ({
  getCategoryDefaultImage: () => '/placeholder.png',
}))

const mockItem = {
  id: 'gear-1',
  name: 'Big Agnes Copper Spur HV UL2',
  brand: 'Big Agnes',
  weightGrams: 1060,
  imageUrl: null,
  condition: 'GOOD',
  category: { id: 'cat-1', name: 'Shelter' },
}

describe('GearCard', () => {
  it('renders name, brand, and category', () => {
    render(<GearCard item={mockItem} />)
    expect(screen.getByText('Big Agnes Copper Spur HV UL2')).toBeInTheDocument()
    expect(screen.getByText('Big Agnes')).toBeInTheDocument()
    expect(screen.getByText('Shelter')).toBeInTheDocument()
  })

  it('shows weight badge by default', () => {
    render(<GearCard item={mockItem} />)
    expect(screen.getByText('1060g')).toBeInTheDocument()
  })

  it('hides weight badge when showWeight is false', () => {
    render(<GearCard item={mockItem} showWeight={false} />)
    expect(screen.queryByText('1060g')).not.toBeInTheDocument()
  })

  it('calls onEdit with the item when clicked and not readOnly', () => {
    const onEdit = vi.fn()
    render(<GearCard item={mockItem} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('Big Agnes Copper Spur HV UL2'))
    expect(onEdit).toHaveBeenCalledWith(mockItem)
  })

  it('does NOT call onEdit when readOnly is true', () => {
    const onEdit = vi.fn()
    render(<GearCard item={mockItem} onEdit={onEdit} readOnly />)
    fireEvent.click(screen.getByText('Big Agnes Copper Spur HV UL2'))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('shows Unknown Brand when brand is null', () => {
    render(<GearCard item={{ ...mockItem, brand: null }} />)
    expect(screen.getByText('Unknown Brand')).toBeInTheDocument()
  })
})
