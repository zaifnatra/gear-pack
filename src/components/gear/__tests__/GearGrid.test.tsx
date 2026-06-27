import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GearGrid } from '@/components/gear/GearGrid'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/constants/category-images', () => ({
  getCategoryDefaultImage: () => '/placeholder.png',
}))

const items = [
  {
    id: '1',
    name: 'Tent',
    brand: 'MSR',
    weightGrams: 1200,
    imageUrl: null,
    condition: 'GOOD',
    category: { id: 'c1', name: 'Shelter' },
  },
  {
    id: '2',
    name: 'Sleeping Bag',
    brand: 'Feathered Friends',
    weightGrams: 800,
    imageUrl: null,
    condition: 'NEW',
    category: { id: 'c2', name: 'Sleep System' },
  },
]

describe('GearGrid', () => {
  it('renders all gear cards when items are provided', () => {
    render(<GearGrid items={items} />)
    expect(screen.getByText('Tent')).toBeInTheDocument()
    expect(screen.getByText('Sleeping Bag')).toBeInTheDocument()
  })

  it('shows "No items found." empty state when items is empty', () => {
    render(<GearGrid items={[]} />)
    expect(screen.getByText('No items found.')).toBeInTheDocument()
  })

  it('shows "User has no gear." empty state when readOnly and items is empty', () => {
    render(<GearGrid items={[]} readOnly />)
    expect(screen.getByText('User has no gear.')).toBeInTheDocument()
  })

  it('shows "Add Item" button in empty state when not readOnly', () => {
    const onEdit = vi.fn()
    render(<GearGrid items={[]} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('Add Item'))
    expect(onEdit).toHaveBeenCalledWith(null)
  })

  it('does NOT show "Add Item" button when readOnly', () => {
    render(<GearGrid items={[]} readOnly />)
    expect(screen.queryByText('Add Item')).not.toBeInTheDocument()
  })
})
