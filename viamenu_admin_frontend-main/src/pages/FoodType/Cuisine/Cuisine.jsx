import { FaPizzaSlice } from 'react-icons/fa';
import LookupTypePage from '../LookupTypePage';

export default function Cuisine() {
  return (
    <LookupTypePage
      endpoint="/admin/restaurant/cuisine"
      nameKey="cuisineName"
      title="Cuisines"
      singular="Cuisine"
      subtitle="Manage different cuisines for restaurants"
      namePlaceholder="e.g., Italian, Chinese, Indian"
      sortKey="cuisines"
      icon={FaPizzaSlice}
    />
  );
}
