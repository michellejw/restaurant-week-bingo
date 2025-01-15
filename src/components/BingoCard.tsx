'use client'

import { useMemo } from 'react'
import type { Restaurant, RestaurantVisit } from '@/types'

interface BingoCardProps {
  restaurants: Restaurant[]
  visits: RestaurantVisit[]
}

export default function BingoCard({ restaurants, visits }: BingoCardProps) {
  const visitedRestaurantIds = visits.map(visit => visit.restaurantId)
  
  // Calculate grid size based on number of restaurants
  const gridSize = useMemo(() => {
    const count = restaurants.length
    if (count <= 9) return 3
    if (count <= 16) return 4
    return 5 // Max 25 restaurants
  }, [restaurants.length])

  // Create a grid of restaurants
  const grid = useMemo(() => {
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
    const cells = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
    
    let index = 0
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (index < shuffled.length) {
          cells[i][j] = shuffled[index]
          index++
        }
      }
    }
    
    return cells
  }, [restaurants, gridSize])

  return (
    <div className="grid gap-2" style={{ 
      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` 
    }}>
      {grid.flat().map((restaurant, index) => (
        <div
          key={restaurant?.id || index}
          className={`
            aspect-square p-2 border-2 rounded-lg flex items-center justify-center text-center
            ${restaurant ? 'border-purple-200' : 'border-gray-100'}
            ${visitedRestaurantIds.includes(restaurant?.id || '') ? 'bg-purple-100' : 'bg-white'}
          `}
        >
          {restaurant?.name || ''}
        </div>
      ))}
    </div>
  )
} 