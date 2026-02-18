import { LoanDetailClient } from './LoanDetailClient';

export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  // In production with database, you could fetch all loan IDs here
  return [];
}

export default function LoanDetailPage() {
  return <LoanDetailClient />;
}
