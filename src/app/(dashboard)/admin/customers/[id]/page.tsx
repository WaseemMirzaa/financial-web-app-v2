import { mockCustomers } from '@/lib/mockData';
import { CustomerDetailClient } from './CustomerDetailClient';

export function generateStaticParams() {
  return mockCustomers.map((customer) => ({
    id: customer.id,
  }));
}

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
