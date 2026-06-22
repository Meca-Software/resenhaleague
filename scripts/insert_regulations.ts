import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const t1 = `
<p>O sistema de pontuação segue o padrão oficial da Fórmula 1:</p>
<ul class="grid grid-cols-2 md:grid-cols-5 gap-2 font-rajdhani font-bold text-foreground mt-4 mb-4">
  <li class="bg-muted p-2 rounded text-center">1º - 25 pts</li>
  <li class="bg-muted p-2 rounded text-center">2º - 18 pts</li>
  <li class="bg-muted p-2 rounded text-center">3º - 15 pts</li>
  <li class="bg-muted p-2 rounded text-center">4º - 12 pts</li>
  <li class="bg-muted p-2 rounded text-center">5º - 10 pts</li>
  <li class="bg-muted p-2 rounded text-center">6º - 8 pts</li>
  <li class="bg-muted p-2 rounded text-center">7º - 6 pts</li>
  <li class="bg-muted p-2 rounded text-center">8º - 4 pts</li>
  <li class="bg-muted p-2 rounded text-center">9º - 2 pts</li>
  <li class="bg-muted p-2 rounded text-center">10º - 1 pt</li>
</ul>
<p class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Volta mais rápida: +1 ponto (se terminar no Top 10).</p>
  `.trim();

  const t2 = `
<p>
  Qualquer incidente deve ser gravado e reportado no Centro dos Comissários até 24h após o término da corrida.
</p>
<ul class="list-disc pl-5 space-y-2 mt-4">
  <li><strong>Toque Leve (sem perda de posição):</strong> Advertência.</li>
  <li><strong>Toque Médio (perda de posição ou dano leve):</strong> +5 segundos ou perda de 3 posições no próximo grid.</li>
  <li><strong>Toque Grave (abandono do adversário):</strong> +10 segundos ou DSQ dependendo da intenção.</li>
  <li><strong>Corte de pista reincidente:</strong> Penalidades automáticas do jogo serão mantidas.</li>
</ul>
  `.trim();

  const { error } = await supabase.from('regulations').insert([
    { title: '1. Sistema de Pontuação', content: t1, order_index: 0, section: 'Geral' },
    { title: '2. Conduta e Penalidades', content: t2, order_index: 1, section: 'Geral' }
  ]);
  
  if (error) console.error(error);
  else console.log('Inseridos com sucesso!');
}

run();
