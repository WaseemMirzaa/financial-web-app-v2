import { CustomerDetailClient } from './CustomerDetailClient';

export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  // In production with database, you could fetch all customer IDs here
  return [];
}

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
