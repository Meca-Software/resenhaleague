"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gauge, Users, Trophy, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EquipesPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('*, pilots(stats)');
      
      if (data) {
        const teamsWithStats = data.map((team: any) => {
          let points = 0;
          let wins = 0;
          let podiums = 0;
          
          if (team.pilots && Array.isArray(team.pilots)) {
            team.pilots.forEach((pilot: any) => {
              if (pilot.stats) {
                points += pilot.stats.points || 0;
                wins += pilot.stats.wins || 0;
                podiums += pilot.stats.podiums || 0;
              }
            });
          }
          
          return { ...team, points, wins, podiums };
        });
        
        teamsWithStats.sort((a: any, b: any) => b.points - a.points);
        setTeams(teamsWithStats);
      }
      setIsLoading(false);
    };

    fetchTeams();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight">EQUIPES CONSTRUTORES</h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            As escuderias oficiais que disputam o título de construtores na Resenha League.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Carregando equipes...</p></div>
      ) : teams.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Nenhuma equipe encontrada.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => {
            const points = team.points || 0;
            const wins = team.wins || 0;
            const podiums = team.podiums || 0;
            
            return (
              <Card key={team.id} className={`overflow-hidden bg-card/50 border-t-4 border-border/50 hover:border-primary/50 transition-colors`} style={{ borderTopColor: team.color }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="h-12 flex items-center justify-start mb-4">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="h-full w-auto max-w-[120px] object-contain drop-shadow-md" />
                      ) : (
                        <Gauge className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-2xl font-orbitron font-black text-foreground/10">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</div>
                  </div>
                  <CardTitle className="font-orbitron text-2xl tracking-tight">{team.name}</CardTitle>
                </CardHeader>
                <CardContent className="bg-background/50 pt-6">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/40">
                    <span className="text-sm font-rajdhani uppercase font-bold text-muted-foreground">Pontos Totais</span>
                    <span className="font-orbitron font-bold text-2xl text-primary">{points}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs font-rajdhani text-muted-foreground uppercase font-bold">Vitórias</div>
                        <div className="font-orbitron font-bold text-lg leading-none">{wins}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs font-rajdhani text-muted-foreground uppercase font-bold">Pódios</div>
                        <div className="font-orbitron font-bold text-lg leading-none">{podiums}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
