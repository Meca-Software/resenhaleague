require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials. Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log("Criando nova conta de admin...");

  const email = "admin@resenhaleague.com";
  const username = "admin.canis";
  const password = "adminpassword123";

  // 1. Cria no Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      username: username,
      role: "superadmin"
    }
  });

  if (authError) {
    console.error("Erro ao criar o usuário no Auth:", authError.message);
    return;
  }

  // 2. Insere na tabela pública
  const newAdmin = {
    id: authData.user.id,
    email: email,
    username: username,
    role: "superadmin"
  };

  const { data, error } = await supabase
    .from('system_users')
    .insert([newAdmin])
    .select();

  if (error) {
    console.error("Erro ao criar perfil do usuário:", error.message);
    // Tenta desfazer no auth
    await supabase.auth.admin.deleteUser(authData.user.id);
  } else {
    console.log("Conta criada com sucesso!");
    console.log("-------------------------------");
    console.log("E-mail para Login:", email);
    console.log("Senha:", password);
    console.log("-------------------------------");
    console.log("Tente fazer login com esses dados no seu site.");
  }
}

createAdmin();
