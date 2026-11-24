import { FaUtensilSpoon } from 'react-icons/fa';
import LookupTypePage from '../LookupTypePage';

export default function DishType() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/dish-type"
      title="Dish Types"
      singular="Dish Type"
      subtitle="Manage different dish types for restaurants"
      namePlaceholder="e.g., Pizza, Curry, Pasta"
      sortKey="dish-types"
      icon={FaUtensilSpoon}
    />
  );
}
