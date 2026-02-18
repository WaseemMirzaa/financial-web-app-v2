import { mockCustomers } from '@/lib/mockData';
import { EmployeeCustomerDetailClient } from './EmployeeCustomerDetailClient';

export function generateStaticParams() {
  return mockCustomers.map((customer) => ({
    id: customer.id,
  }));
}

export default function EmployeeCustomerDetailPage() {
  return <EmployeeCustomerDetailClient />;
}
