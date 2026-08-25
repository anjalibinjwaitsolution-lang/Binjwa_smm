const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nieemhyzusnzhwlnahfp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZWVtaHl6dXNuemh3bG5haGZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE5NTQwOSwiZXhwIjoyMDk5NzcxNDA5fQ.wY-0DJey-C8t-thIXg27A_IiCiD2BsivPYaxjmoiY8E'
);

async function check() {
  const { data, error } = await supabase.from('support_tickets').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
