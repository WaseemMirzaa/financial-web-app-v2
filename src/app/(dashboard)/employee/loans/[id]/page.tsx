import { EmployeeLoanDetailClient } from './EmployeeLoanDetailClient';

export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  return [];
}

export default function EmployeeLoanDetailPage() {
  return <EmployeeLoanDetailClient />;
}
