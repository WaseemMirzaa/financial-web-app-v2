import { mockLoans } from '@/lib/mockData';
import { EmployeeLoanDetailClient } from './EmployeeLoanDetailClient';

export function generateStaticParams() {
  return mockLoans.map((loan) => ({
    id: loan.id,
  }));
}

export default function EmployeeLoanDetailPage() {
  return <EmployeeLoanDetailClient />;
}
