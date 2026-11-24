import { FaAppleAlt } from 'react-icons/fa';
import LookupTypePage from '../LookupTypePage';

export default function DietType() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/diet-type"
      title="Diet Types"
      singular="Diet Type"
      subtitle="Manage different diet types for restaurants"
      namePlaceholder="e.g., Vegan, Vegetarian, Gluten-Free"
      sortKey="diet-types"
      icon={FaAppleAlt}
    />
  );
}
