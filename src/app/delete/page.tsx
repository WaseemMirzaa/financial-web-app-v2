import { redirect } from 'next/navigation';

export default function DeleteLegacyPage() {
  redirect('/delete-account');
}
