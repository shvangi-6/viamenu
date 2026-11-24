import { FaUtensils } from 'react-icons/fa';
import LookupTypePage from '../FoodType/LookupTypePage';

export default function ServiceType() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/service-type"
      title="Service Types"
      singular="Service Type"
      subtitle="Manage different restaurant service types"
      namePlaceholder="e.g., Buffet, Table Service, Delivery"
      sortKey="service-types"
      icon={FaUtensils}
    />
  );
}
