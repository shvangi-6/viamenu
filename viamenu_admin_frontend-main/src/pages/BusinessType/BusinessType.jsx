import { FaBriefcase } from 'react-icons/fa';
import LookupTypePage from '../FoodType/LookupTypePage';

export default function BusinessType() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/business-type"
      title="Business Types"
      singular="Business Type"
      subtitle="Manage different business types for restaurants"
      namePlaceholder="e.g., Business-Lunch Restaurant, Luxury Restaurant"
      sortKey="business-types"
      icon={FaBriefcase}
    />
  );
}
