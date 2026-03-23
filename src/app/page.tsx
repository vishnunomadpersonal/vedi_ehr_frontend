import { redirect } from 'next/navigation';

export default async function Page() {
  // Custom auth is client-side; redirect to dashboard (client-side auth guard handles the rest)
  redirect('/dashboard/overview');
}
