import { redirect } from 'next/navigation';

export default async function Page() {
  // Custom auth is client-side; redirect to login which handles auth check
  redirect('/login');
}
