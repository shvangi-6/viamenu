import { FaStore } from 'react-icons/fa';
import LookupTypePage from '../FoodType/LookupTypePage';

export default function RestaurantType() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/type"
      title="Restaurant Types"
      singular="Restaurant Type"
      subtitle="Manage restaurant concepts"
      namePlaceholder="e.g., Fine Dining, Casual Dining, Fast Food"
      sortKey="restaurant-types"
      icon={FaStore}
    />
  );
}
