import { EmployeeCustomerDetailClient } from './EmployeeCustomerDetailClient';

export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  return [];
}

export default function EmployeeCustomerDetailPage() {
  return <EmployeeCustomerDetailClient />;
}
