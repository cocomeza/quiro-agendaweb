import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AgendaPage from '@/components/AgendaPage';

export default async function Home() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  // Log para debug
  if (error) {
    console.error('Error getting session in page:', error);
  }

  if (!session) {
    console.log('No session found, redirecting to login');
    redirect('/login');
  }

  console.log('Session found, rendering AgendaPage');
  return <AgendaPage />;
}

