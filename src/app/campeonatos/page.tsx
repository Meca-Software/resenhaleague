"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, CalendarDays, Medal, Gauge, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CampeonatosPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [pilots, setPilots] = useState<any[]>([]);
  const [constructors, setConstructors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*, championships(name, tier)')
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setSeasons(data);
        setActiveSeason(data[0]); // Seleciona a primeira por padrão
      }
      setIsLoading(false);
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    if (!activeSeason) return;

    const fetchStandings = async () => {
      // Idealmente a filtragem de pilotos consideraria o season_id no futuro.
      // Atualmente buscamos todos os pilotos e ordenamos por pontos do stats JSONB.
      const { data, error } = await supabase
        .from('pilots')
        .select('*, teams(id, name, color), system_users(full_name, username)');
      
      if (data) {
        const sortedPilots = data.sort((a, b) => {
          const ptsA = a.stats?.points || 0;
          const ptsB = b.stats?.points || 0;
          return ptsB - ptsA;
        });
        setPilots(sortedPilots);

        const teamsMap: Record<string, any> = {};
        data.forEach(pilot => {
          if (pilot.teams) {
            if (!teamsMap[pilot.teams.name]) {
              teamsMap[pilot.teams.name] = {
                id: pilot.teams.id || pilot.teams.name,
                name: pilot.teams.name,
                color: pilot.teams.color,
                points: 0,
                wins: 0
              };
            }
            teamsMap[pilot.teams.name].points += (pilot.stats?.points || 0);
            teamsMap[pilot.teams.name].wins += (pilot.stats?.wins || 0);
          }
        });
        
        const sortedConstructors = Object.values(teamsMap).sort((a, b) => b.points - a.points);
        setConstructors(sortedConstructors);
      }
    };

    fetchStandings();
  }, [activeSeason]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight">CAMPEONATOS</h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Acompanhe a classificação oficial, calendários e estatísticas de todas as categorias da Resenha League.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Nenhum campeonato encontrado.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-rajdhani text-xl font-bold tracking-widest text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5" /> CATEGORIAS
            </h2>
            <div className="flex flex-col gap-3">
              {seasons.map((season) => (
                <Card 
                  key={season.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    activeSeason?.id === season.id ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(225,6,0,0.1)]" : "bg-card/50"
                  }`}
                  onClick={() => setActiveSeason(season)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline" className="font-orbitron border-primary text-primary text-xs">
                        T{season.championships?.tier}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-exo2">{season.status}</span>
                    </div>
                    <CardTitle className="font-orbitron text-lg">{season.championships?.name}</CardTitle>
                    <CardDescription className="font-rajdhani">{season.name}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            {activeSeason && (
              <Card className="bg-card/50 border-border/50 min-h-[600px]">
                <CardHeader className="border-b border-border/40 pb-6 mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="font-orbitron text-3xl flex items-center gap-3">
                        {activeSeason.championships?.name}
                      </CardTitle>
                      <CardDescription className="font-rajdhani text-lg mt-1 text-primary">
                        {activeSeason.name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-exo2 text-sm px-4 py-1">Estatísticas Oficiais</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="pilots" className="w-full">
                    <TabsList className="flex w-full mb-8 h-12 bg-muted/50 p-1">
                      <TabsTrigger value="pilots" className="font-rajdhani text-base font-bold">Pilotos</TabsTrigger>
                      <TabsTrigger value="constructors" className="font-rajdhani text-base font-bold">Construtores</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pilots" className="animate-in fade-in-50 duration-500">
                      <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50 font-rajdhani">
                            <TableRow>
                              <TableHead className="w-16 text-center">POS</TableHead>
                              <TableHead>PILOTO</TableHead>
                              <TableHead className="hidden md:table-cell">EQUIPE</TableHead>
                              <TableHead className="text-center w-24">VITÓRIAS</TableHead>
                              <TableHead className="text-right w-24 font-bold text-primary">PTS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="font-exo2">
                            {pilots.map((pilot, idx) => (
                              <TableRow key={pilot.id}>
                                <TableCell className="text-center font-orbitron font-bold text-lg">{idx + 1}</TableCell>
                                <TableCell className="font-bold flex items-center gap-3">
                                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: pilot.teams?.color || '#555' }} />
                                  {pilot.system_users?.full_name || pilot.system_users?.username || pilot.name}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">{pilot.teams?.name || 'Agente Livre'}</TableCell>
                                <TableCell className="text-center">{pilot.stats?.wins || 0}</TableCell>
                                <TableCell className="text-right font-orbitron font-bold text-lg text-primary">{pilot.stats?.points || 0}</TableCell>
                              </TableRow>
                            ))}
                            {pilots.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  Nenhum piloto registrado.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="constructors" className="animate-in fade-in-50 duration-500">
                      <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50 font-rajdhani">
                            <TableRow>
                              <TableHead className="w-16 text-center">POS</TableHead>
                              <TableHead>EQUIPE</TableHead>
                              <TableHead className="text-center w-24">VITÓRIAS</TableHead>
                              <TableHead className="text-right w-24 font-bold text-primary">PTS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="font-exo2">
                            {constructors.map((team, idx) => (
                              <TableRow key={team.id}>
                                <TableCell className="text-center font-orbitron font-bold text-lg">{idx + 1}</TableCell>
                                <TableCell className="font-bold flex items-center gap-3">
                                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: team.color || '#555' }} />
                                  {team.name}
                                </TableCell>
                                <TableCell className="text-center">{team.wins || 0}</TableCell>
                                <TableCell className="text-right font-orbitron font-bold text-lg text-primary">{team.points || 0}</TableCell>
                              </TableRow>
                            ))}
                            {constructors.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                  Nenhuma equipe registrada na classificação.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
