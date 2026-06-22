require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding roles...");
  
  const superadminPermissions = [
    "dashboard", "resultados", "pilotos", "campeonatos", 
    "corridas", "stewards", "contas", "noticias", "config", "permissoes"
  ];
  
  const pilotoPermissions = ["dashboard", "resultados"];
  
  // Check if they exist
  const { data: existing } = await supabase.from('roles').select('*');
  
  const existingNames = existing?.map(r => r.name) || [];
  
  if (!existingNames.includes("Superadmin")) {
    const { error } = await supabase.from('roles').insert([{
      name: "Superadmin",
      permissions: superadminPermissions
    }]);
    if (error) console.error("Error inserting Superadmin:", error);
    else console.log("Superadmin created.");
  } else {
    console.log("Superadmin already exists.");
  }
  
  if (!existingNames.includes("Piloto")) {
    const { error } = await supabase.from('roles').insert([{
      name: "Piloto",
      permissions: pilotoPermissions
    }]);
    if (error) console.error("Error inserting Piloto:", error);
    else console.log("Piloto created.");
  } else {
    console.log("Piloto already exists.");
  }
  
  console.log("Done.");
}

seed();
