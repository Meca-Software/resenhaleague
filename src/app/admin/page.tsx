"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length > 2) return "🏁";
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};
import { Users, Trophy, Flag, AlertTriangle, Activity, TrendingUp, CalendarDays, PlusCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AdminDashboard() {
  const [activePilotsCount, setActivePilotsCount] = useState(0);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState(0);
  const [remainingRacesCount, setRemainingRacesCount] = useState(0);
  const [upcomingRaces, setUpcomingRaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      const { count: pilotsCount } = await supabase
        .from("pilots")
        .select("*", { count: "exact", head: true });
      if (pilotsCount !== null) setActivePilotsCount(pilotsCount);

      const { count: incidentsCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "investigating"]);
      if (incidentsCount !== null) setPendingIncidentsCount(incidentsCount);

      const { data: racesData } = await supabase
        .from("races")
        .select("*, seasons(name, championships(name))")
        .eq("status", "upcoming")
        .order("race_date", { ascending: true });

      if (racesData) {
        setRemainingRacesCount(racesData.length);
        setUpcomingRaces(racesData.slice(0, 2));
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight">RESUMO DA LIGA</h1>
          <p className="text-muted-foreground font-exo2 mt-1">Visão geral do sistema e atalhos rápidos.</p>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium font-rajdhani text-muted-foreground uppercase">Pilotos Ativos</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold font-orbitron">
              {isLoading ? "-" : activePilotsCount}
            </div>
            <p className="text-xs text-primary font-exo2 flex items-center mt-1">
              Pilotos registrados no banco
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium font-rajdhani text-muted-foreground uppercase">Incidentes Pendentes</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold font-orbitron text-amber-500">
              {isLoading ? "-" : pendingIncidentsCount}
            </div>
            <p className="text-xs text-muted-foreground font-exo2 mt-1">Requer análise dos comissários</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium font-rajdhani text-muted-foreground uppercase">Corridas Restantes</CardTitle>
            <Flag className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold font-orbitron">
              {isLoading ? "-" : remainingRacesCount}
            </div>
            <p className="text-xs text-muted-foreground font-exo2 mt-1">Agendadas no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium font-rajdhani text-muted-foreground uppercase">Status do Sistema</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold font-orbitron text-green-500">Online</div>
            <p className="text-xs text-muted-foreground font-exo2 mt-1">Bancos Sincronizados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PRÓXIMAS CORRIDAS */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Próximas Etapas
            </CardTitle>
            <CardDescription className="font-exo2">Corridas agendadas para os próximos dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground font-exo2 text-sm">Carregando corridas...</div>
            ) : upcomingRaces.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground font-exo2 text-sm">Nenhuma corrida agendada.</div>
            ) : (
              upcomingRaces.map((race, idx) => {
                const raceDate = new Date(race.race_date);
                const isVerySoon = (raceDate.getTime() - new Date().getTime()) < 3 * 24 * 60 * 60 * 1000 && (raceDate.getTime() - new Date().getTime()) > 0;
                
                return (
                  <div key={race.id} className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-background/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border border-border/50 font-bold text-lg">
                        {getFlagEmoji(race.country_code)}
                      </div>
                      <div>
                        <h4 className="font-rajdhani font-bold text-base truncate max-w-[150px] sm:max-w-[200px]">{race.name}</h4>
                        <p className="text-xs text-muted-foreground font-exo2 truncate max-w-[150px] sm:max-w-[200px]">
                          {race.track_name} • {race.seasons?.name || "Sem temporada"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isVerySoon ? (
                        <Badge variant="outline" className="font-rajdhani border-primary text-primary bg-primary/10 uppercase mb-1">Próxima</Badge>
                      ) : (
                        <Badge variant="outline" className="font-rajdhani border-muted-foreground text-muted-foreground bg-muted uppercase mb-1">Agendada</Badge>
                      )}
                      <div className="text-xs font-exo2 font-bold">{raceDate.toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                );
              })
            )}
            
            <Link href="/admin/corridas">
              <Button variant="outline" className="w-full mt-2 font-exo2 border-primary/20 hover:bg-primary/10">Ver Calendário Completo</Button>
            </Link>
          </CardContent>
        </Card>

        {/* ATALHOS / AÇÕES RÁPIDAS */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Acesso Rápido</CardTitle>
            <CardDescription className="font-exo2">Ações frequentes de gerenciamento.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <Link href="/admin/stewards">
              <div className="group flex flex-col p-5 border border-border/40 rounded-xl bg-background/30 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer h-full relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                <h4 className="font-rajdhani font-bold text-base">Analisar Incidentes</h4>
                <p className="text-xs text-muted-foreground font-exo2 mt-1">3 novos protestos recebidos para análise dos comissários.</p>
              </div>
            </Link>

            <Link href="/admin/corridas">
              <div className="group flex flex-col p-5 border border-border/40 rounded-xl bg-background/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                <Trophy className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-rajdhani font-bold text-base">Atualizar Classificação</h4>
                <p className="text-xs text-muted-foreground font-exo2 mt-1">Inserir resultados e tempos da última etapa corrida.</p>
              </div>
            </Link>

            <Link href="/admin/pilotos">
              <div className="group flex flex-col p-5 border border-border/40 rounded-xl bg-background/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer h-full relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-green-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                <Users className="w-8 h-8 text-green-500 mb-3" />
                <h4 className="font-rajdhani font-bold text-base">Aprovar Pilotos</h4>
                <p className="text-xs text-muted-foreground font-exo2 mt-1">Gerenciar novas inscrições na liga e distribuir licenças.</p>
              </div>
            </Link>

            <Link href="/admin/noticias">
              <div className="group flex flex-col p-5 border border-border/40 rounded-xl bg-background/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer h-full relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                <FileText className="w-8 h-8 text-purple-500 mb-3" />
                <h4 className="font-rajdhani font-bold text-base">Publicar Notícia</h4>
                <p className="text-xs text-muted-foreground font-exo2 mt-1">Informar a comunidade sobre punições ou resumos de GP.</p>
              </div>
            </Link>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
