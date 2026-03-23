import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Custom auth is client-side; always redirect to overview
  redirect('/dashboard/overview');
}
