"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";

export default function RegulamentoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> REGULAMENTO OFICIAL
          </h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Regras de conduta, punições, sistema de pontuação e diretrizes do campeonato.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl text-primary">1. Sistema de Pontuação</CardTitle>
          </CardHeader>
          <CardContent className="font-exo2 text-muted-foreground space-y-4">
            <p>O sistema de pontuação segue o padrão oficial da Fórmula 1:</p>
            <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 font-rajdhani font-bold text-foreground">
              <li className="bg-muted p-2 rounded text-center">1º - 25 pts</li>
              <li className="bg-muted p-2 rounded text-center">2º - 18 pts</li>
              <li className="bg-muted p-2 rounded text-center">3º - 15 pts</li>
              <li className="bg-muted p-2 rounded text-center">4º - 12 pts</li>
              <li className="bg-muted p-2 rounded text-center">5º - 10 pts</li>
              <li className="bg-muted p-2 rounded text-center">6º - 8 pts</li>
              <li className="bg-muted p-2 rounded text-center">7º - 6 pts</li>
              <li className="bg-muted p-2 rounded text-center">8º - 4 pts</li>
              <li className="bg-muted p-2 rounded text-center">9º - 2 pts</li>
              <li className="bg-muted p-2 rounded text-center">10º - 1 pt</li>
            </ul>
            <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Volta mais rápida: +1 ponto (se terminar no Top 10).</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl text-primary">2. Conduta e Penalidades</CardTitle>
          </CardHeader>
          <CardContent className="font-exo2 text-muted-foreground space-y-4">
            <p>
              Qualquer incidente deve ser gravado e reportado no Centro dos Comissários até 24h após o término da corrida.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Toque Leve (sem perda de posição):</strong> Advertência.</li>
              <li><strong>Toque Médio (perda de posição ou dano leve):</strong> +5 segundos ou perda de 3 posições no próximo grid.</li>
              <li><strong>Toque Grave (abandono do adversário):</strong> +10 segundos ou DSQ dependendo da intenção.</li>
              <li><strong>Corte de pista reincidente:</strong> Penalidades automáticas do jogo serão mantidas.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
