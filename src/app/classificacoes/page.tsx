"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";

export default function ClassificacoesPage() {
  const [pilots, setPilots] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Busca pilotos
      const { data: pilotsData } = await supabase
        .from('pilots')
        .select('*, teams(name, color)')
        .not('season_id', 'is', null);
      
      // Busca equipes
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*');

      if (pilotsData) {
        // Ordena por pontos de forma decrescente
        const sortedPilots = pilotsData.sort((a, b) => {
          const ptsA = a.stats?.points || 0;
          const ptsB = b.stats?.points || 0;
          return ptsB - ptsA;
        });
        setPilots(sortedPilots);
      }

      if (teamsData) {
        // Mock de pontos por equipe (como a estrutura de pontuação de equipes ainda precisará ser calculada)
        const teamsWithPoints = teamsData.map(team => {
          // Calcula pontos somando os pilotos da equipe
          const teamPoints = (pilotsData || [])
            .filter(p => p.current_team_id === team.id)
            .reduce((acc, p) => acc + (p.stats?.points || 0), 0);
          return { ...team, points: teamPoints };
        }).sort((a, b) => b.points - a.points);
        
        setTeams(teamsWithPoints);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="space-y-2 border-b border-border/40 pb-6 text-center md:text-left">
        <h1 className="text-4xl font-bold font-orbitron tracking-tight text-primary flex items-center justify-center md:justify-start gap-3">
          <Trophy className="w-10 h-10" /> CLASSIFICAÇÃO
        </h1>
        <p className="text-muted-foreground font-exo2 max-w-2xl mx-auto md:mx-0">
          Acompanhe a tabela do campeonato de pilotos e construtores da temporada atual.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground font-exo2 animate-pulse">Carregando classificações...</p>
        </div>
      ) : (
        <Tabs defaultValue="pilotos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-card/50 border-border/50">
            <TabsTrigger value="pilotos" className="font-rajdhani font-bold text-lg tracking-wider">MUNDIAL DE PILOTOS</TabsTrigger>
            <TabsTrigger value="construtores" className="font-rajdhani font-bold text-lg tracking-wider">MUNDIAL DE CONSTRUTORES</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pilotos" className="space-y-4">
            <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 font-rajdhani text-sm uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-bold text-center w-16">POS</th>
                      <th className="px-6 py-4 font-bold">Piloto</th>
                      <th className="px-6 py-4 font-bold hidden md:table-cell">Equipe</th>
                      <th className="px-6 py-4 font-bold text-right">Vitórias</th>
                      <th className="px-6 py-4 font-bold text-right text-primary">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="font-exo2">
                    {pilots.map((pilot, index) => (
                      <tr key={pilot.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4 text-center font-orbitron font-bold text-lg text-muted-foreground group-hover:text-foreground">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/profile/${pilot.profile_id || pilot.id}`} className="flex items-center gap-3">
                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: pilot.teams?.color || '#555' }} />
                            <div>
                              <p className="font-bold font-rajdhani text-lg group-hover:text-primary transition-colors">{pilot.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{pilot.teams?.name || "Agente Livre"}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                          {pilot.teams?.name || "Agente Livre"}
                        </td>
                        <td className="px-6 py-4 text-right font-orbitron text-muted-foreground">
                          {pilot.stats?.wins || 0}
                        </td>
                        <td className="px-6 py-4 text-right font-orbitron font-bold text-xl text-primary">
                          {pilot.stats?.points || 0}
                        </td>
                      </tr>
                    ))}
                    {pilots.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum piloto registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="construtores" className="space-y-4">
            <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 font-rajdhani text-sm uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-bold text-center w-16">POS</th>
                      <th className="px-6 py-4 font-bold">Construtor</th>
                      <th className="px-6 py-4 font-bold text-right text-primary">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="font-exo2">
                    {teams.map((team, index) => (
                      <tr key={team.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4 text-center font-orbitron font-bold text-lg text-muted-foreground group-hover:text-foreground">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: team.color || '#555' }} />
                          <p className="font-bold font-rajdhani text-lg">{team.name}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-orbitron font-bold text-xl text-primary">
                          {team.points || 0}
                        </td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhuma equipe registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
