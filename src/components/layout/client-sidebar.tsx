'use client';
import dynamic from 'next/dynamic';

const AppSidebar = dynamic(() => import('./app-sidebar'), { ssr: false });

export function ClientSidebar() {
  return <AppSidebar />;
}
