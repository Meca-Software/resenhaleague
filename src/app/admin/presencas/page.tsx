'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminUpdateAttendance } from '@/app/actions/attendance-actions';

export default function PresencasAdminPage() {
  const [loading, setLoading] = useState(true);
  const [race, setRace] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Next Race
      const { data: racesData } = await supabase
        .from('races')
        .select('*, seasons(name, championships(name))')
        .eq('status', 'upcoming')
        .order('race_date', { ascending: true })
        .limit(1);

      if (!racesData || racesData.length === 0) {
        setRace(null);
        setLoading(false);
        return;
      }
      const raceData = racesData[0];
      setRace(raceData);

      // 2. All pilots and teams
      const { data: teamsData } = await supabase.from('teams').select('*').order('name');
      const { data: pilotsData } = await supabase.from('pilots').select('*, teams(name)').order('name');
      
      setTeams(teamsData || []);
      setPilots(pilotsData || []);

      // 3. Attendances
      const { data: attendanceData } = await supabase
        .from('race_attendances')
        .select('*')
        .eq('race_id', raceData.id);

      setAttendances(attendanceData || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminUpdate = async (pilotId: string, status: string) => {
    if (!race) return;
    try {
      const res = await adminUpdateAttendance(race.id, pilotId, status);
      if (res.success) {
        toast.success('Status atualizado com sucesso!');
        fetchData();
      } else {
        toast.error('Erro: ' + res.error);
      }
    } catch (e) {
      toast.error('Erro inesperado ao atualizar status');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando painel de presenças...</div>;
  }

  if (!race) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold font-orbitron">Nenhuma Corrida Programada</h2>
        <p className="text-muted-foreground">Não há nenhuma corrida com status "upcoming".</p>
      </div>
    );
  }

  // Helper to get pilot's status
  const getStatus = (pilotId: string) => {
    const att = attendances.find(a => a.pilot_id === pilotId);
    return att?.status || 'PENDING';
  };

  // Group pilots
  const titularPilots = pilots.filter(p => !p.is_reserve);
  const reservePilots = pilots.filter(p => p.is_reserve);

  // Group Titulares by Team
  const teamsWithPilots = teams.map(team => {
    return {
      ...team,
      pilots: titularPilots.filter(p => p.current_team_id === team.id)
    };
  });

  // Calculate totals
  const totalConfirmed = attendances.filter(a => a.status === 'CONFIRMED').length;
  const totalAbsent = attendances.filter(a => a.status === 'ABSENT').length;
  const totalAvailable = attendances.filter(a => a.status === 'AVAILABLE').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Confirmado</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Ausente</Badge>;
      case 'AVAILABLE':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Disponível</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1"/> Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-orbitron uppercase">Gestão de Presenças</h1>
          <p className="text-muted-foreground font-exo2">Visualize e gerencie quem vai correr na próxima etapa.</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      <Card className="bg-card/40 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="font-rajdhani font-bold text-primary uppercase tracking-widest">
                {race.seasons?.championships?.name}
              </CardDescription>
              <CardTitle className="text-2xl font-orbitron">{race.name}</CardTitle>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-orbitron font-bold text-green-500">{totalConfirmed}</p>
                <p className="text-xs text-muted-foreground uppercase">Confirmados</p>
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold text-destructive">{totalAbsent}</p>
                <p className="text-xs text-muted-foreground uppercase">Ausentes</p>
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold text-blue-500">{totalAvailable}</p>
                <p className="text-xs text-muted-foreground uppercase">Reservas Disp.</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TITULARES POR EQUIPE */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-orbitron font-bold text-xl uppercase text-muted-foreground">Grid Titular</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamsWithPilots.map(team => (
              <Card key={team.id} className="bg-card/50 border-border/50">
                <CardHeader className="py-3 px-4 border-b border-border/20">
                  <CardTitle className="text-sm font-orbitron font-bold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || '#ccc' }} />
                    {team.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {team.pilots.length === 0 && (
                    <div className="p-4 text-xs text-muted-foreground text-center">Nenhum titular.</div>
                  )}
                  {team.pilots.map((pilot: any) => {
                    const status = getStatus(pilot.id);
                    return (
                      <div key={pilot.id} className="flex items-center justify-between p-3 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-rajdhani font-bold text-sm">{pilot.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{pilot.game_id || 'ID N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status)}
                          <Select 
                            defaultValue={status} 
                            onValueChange={(val) => handleAdminUpdate(pilot.id, val)}
                          >
                            <SelectTrigger className="w-[110px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendente</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmar</SelectItem>
                              <SelectItem value="ABSENT">Ausente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PILOTOS RESERVAS */}
        <div className="space-y-4">
          <h3 className="font-orbitron font-bold text-xl uppercase text-muted-foreground">Pilotos Reservas</h3>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-0">
              {reservePilots.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Nenhum piloto reserva cadastrado.</div>
              ) : (
                reservePilots.map((pilot: any) => {
                  const status = getStatus(pilot.id);
                  return (
                    <div key={pilot.id} className="flex flex-col gap-2 p-3 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-rajdhani font-bold text-sm">{pilot.name}</span>
                        {getStatusBadge(status)}
                      </div>
                      <div className="flex justify-end">
                        <Select 
                          defaultValue={status} 
                          onValueChange={(val) => handleAdminUpdate(pilot.id, val)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendente</SelectItem>
                            <SelectItem value="AVAILABLE">Disponível</SelectItem>
                            <SelectItem value="CONFIRMED">Alocado (Correrá)</SelectItem>
                            <SelectItem value="ABSENT">Ausente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
