import { mockEmployees } from '@/lib/mockData';
import { EmployeeDetailClient } from './EmployeeDetailClient';

export function generateStaticParams() {
  return mockEmployees.map((employee) => ({
    id: employee.id,
  }));
}

export default function EmployeeDetailPage() {
  return <EmployeeDetailClient />;
}
