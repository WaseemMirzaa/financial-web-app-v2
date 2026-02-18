import { mockLoans } from '@/lib/mockData';
import { LoanDetailClient } from './LoanDetailClient';

export function generateStaticParams() {
  return mockLoans.map((loan) => ({
    id: loan.id,
  }));
}

export default function LoanDetailPage() {
  return <LoanDetailClient />;
}
