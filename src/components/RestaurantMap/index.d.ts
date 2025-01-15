import { Restaurant, RestaurantVisit } from '@/types'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  visits: RestaurantVisit[]
}

declare const RestaurantMap: React.FC<RestaurantMapProps>
export default RestaurantMap 