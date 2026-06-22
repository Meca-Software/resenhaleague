"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, AlertTriangle, ShieldCheck, Info, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PortalLicencaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [penaltyHistory, setPenaltyHistory] = useState<any[]>([]);
  const maxPoints = 12; // Exemplo de limite de pontos

  const loadData = async () => {
    setIsLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabaseClient = createClient();
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const userId = session?.user?.id;
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Pega o piloto do usuário logado
    const { data: myPilot } = await supabase.from('pilots').select('*').eq('profile_id', userId).single();
    
    if (myPilot) {
      // Pega o histórico de incidentes onde este piloto foi penalizado com pontos na licença
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('*, races(name, track_name)')
        .eq('involved_pilot_id', myPilot.id)
        .eq('status', 'resolved')
        .gt('license_points', 0)
        .order('resolved_at', { ascending: false });
      
      if (incidentsData) {
        setPenaltyHistory(incidentsData);
        // Calcula o total de pontos
        const totalPoints = incidentsData.reduce((acc, curr) => acc + (curr.license_points || 0), 0);
        setPoints(totalPoints);
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" /> MINHA SUPER LICENÇA
        </h1>
        <p className="text-muted-foreground font-exo2 mt-1">
          Acompanhe seu histórico disciplinar e os pontos de penalidade na liga.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Principal: Status da Licença */}
        <Card className="md:col-span-2 bg-card/40 border-border/50 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 transition-transform ${points >= 10 ? 'bg-destructive/20' : points > 5 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}></div>
          <CardHeader className="border-b border-border/40 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-orbitron text-xl">Status Atual</CardTitle>
                <CardDescription className="font-exo2 mt-1">Sua carteira de pontos da temporada ativa.</CardDescription>
              </div>
              <Badge variant="outline" className={`font-rajdhani uppercase tracking-widest text-xs py-1 px-3 border ${points >= 10 ? 'border-destructive text-destructive bg-destructive/10' : points > 5 ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-green-500 text-green-500 bg-green-500/10'}`}>
                {points >= 10 ? 'Risco de Banimento' : points > 5 ? 'Atenção' : 'Licença Limpa'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-1">
                <span className="text-sm font-rajdhani font-bold text-muted-foreground uppercase tracking-wider">Pontos Acumulados</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-orbitron font-bold ${points >= 10 ? 'text-destructive' : points > 5 ? 'text-amber-500' : 'text-green-500'}`}>{points}</span>
                  <span className="text-xl font-exo2 text-muted-foreground">/ {maxPoints}</span>
                </div>
              </div>
              <div className="text-right">
                {points <= 5 ? (
                  <ShieldCheck className="w-12 h-12 text-green-500 opacity-80" />
                ) : (
                  <AlertTriangle className={`w-12 h-12 opacity-80 ${points >= 10 ? 'text-destructive' : 'text-amber-500'}`} />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-exo2 text-muted-foreground mb-1">
                <span>0 pts (Limpa)</span>
                <span>12 pts (Banimento)</span>
              </div>
              <Progress value={(points / maxPoints) * 100} className={`h-3 bg-muted ${points >= 10 ? '[&>div]:bg-destructive' : points > 5 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-exo2 text-muted-foreground leading-relaxed">
                Os pontos da Super Licença são resetados ao final de cada temporada. O acúmulo de {maxPoints} pontos resulta na desclassificação automática da temporada atual e perda da vaga na equipe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Lateral: Histórico de Punições */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg flex flex-col h-full max-h-[600px]">
          <CardHeader className="border-b border-border/40 pb-4 shrink-0">
            <CardTitle className="font-orbitron text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> Histórico Disciplinar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col overflow-y-auto">
            {penaltyHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-8">
                <ShieldCheck className="w-16 h-16 mb-4 text-green-500" />
                <p className="font-rajdhani font-bold text-lg text-foreground">Tudo Limpo!</p>
                <p className="text-sm font-exo2 text-muted-foreground mt-1">Você não possui nenhuma infração registrada na temporada atual.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {penaltyHistory.map(incident => (
                  <div key={incident.id} className="p-3 border border-border/50 bg-background/50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-rajdhani font-bold text-sm truncate max-w-[150px]">
                        {incident.races?.name || incident.races?.track_name || 'GP'}
                      </span>
                      <span className="text-xs text-destructive font-bold whitespace-nowrap">+{incident.license_points} pts</span>
                    </div>
                    <p className="text-xs font-exo2 text-muted-foreground line-clamp-3" title={incident.official_decision || incident.description}>
                      {incident.official_decision || "Incidente penalizado."}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 font-exo2 text-right">
                      {new Date(incident.resolved_at || incident.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

