'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('subjects')
          .select('id')
          .limit(1);

        if (error) throw error;

        setStatus('Supabase connection successful!');
      } catch (error) {
        setStatus('Connection error: ' + error.message);
      }
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>ASSAM ASTRA Database Test</h1>
      <p>{status}</p>
    </main>
  );
}
