'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateAttendance } from '@/app/actions/attendance-actions';
import { toast } from 'sonner';
import { Calendar, MapPin, Flag, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProximaCorridaPage() {
  const [loading, setLoading] = useState(true);
  const [race, setRace] = useState<any>(null);
  const [pilot, setPilot] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Buscar perfil do piloto
      const { data: pilotsData } = await supabase
        .from('pilots')
        .select('*')
        .eq('profile_id', user.id)
        .limit(1);
      
      let pilotData = null;
      if (pilotsData && pilotsData.length > 0) {
        pilotData = pilotsData[0];
        setPilot(pilotData);
      }

      if (!pilotData || !pilotData.season_id) {
        // Se o piloto não tem season_id, não pode ter próxima corrida para confirmar
        return;
      }

      let racesQuery = supabase
        .from('races')
        .select('*, seasons(name, championships(name))')
        .eq('status', 'upcoming')
        .eq('season_id', pilotData.season_id)
        .order('race_date', { ascending: true })
        .limit(1);

      const { data: racesData, error: racesError } = await racesQuery;
      if (racesError) console.error('Races Error:', racesError);

      if (racesData && racesData.length > 0) {
        const raceData = racesData[0];
        setRace(raceData);
        
        // Buscar status atual
        const { data: attendanceData } = await supabase
          .from('race_attendances')
          .select('*, teams(name)')
          .eq('race_id', raceData.id)
          .eq('pilot_id', pilotData.id)
          .limit(1);
          
        if (attendanceData && attendanceData.length > 0) {
          setAttendance(attendanceData[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!race || !pilot) return;
    
    setActionLoading(true);
    try {
      const res = await updateAttendance(race.id, pilot.id, status);
      if (res.success) {
        toast.success(`Presença atualizada para: ${status}`);
        fetchData(); // recarregar status
      } else {
        toast.error('Erro ao atualizar presença: ' + res.error);
      }
    } catch (err) {
      toast.error('Erro ao atualizar presença');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-exo2 text-muted-foreground">Carregando dados da próxima corrida...</div>;
  }

  if (!race) {
    if (pilot && !pilot.season_id) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold font-orbitron mb-2">NENHUMA TEMPORADA VINCULADA</h2>
          <p className="text-muted-foreground font-exo2">Você ainda não está vinculado a uma temporada para ver as corridas.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <Flag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold font-orbitron mb-2">NENHUMA CORRIDA PROGRAMADA</h2>
        <p className="text-muted-foreground font-exo2">O calendário atual não possui próximas corridas agendadas.</p>
      </div>
    );
  }

  const raceDate = new Date(race.race_date);
  const now = new Date();
  
  // Prazo Limite: 2 horas antes da corrida
  const deadlineTime = new Date(raceDate.getTime() - 2 * 60 * 60 * 1000);
  const isPastDeadline = now > deadlineTime;
  
  const isReserve = pilot?.is_reserve === true;
  const currentStatus = attendance?.status || 'PENDING';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold font-orbitron text-foreground uppercase">Próxima Corrida</h1>
        <p className="text-muted-foreground font-exo2">Confirme sua presença ou ausência para a próxima etapa.</p>
      </div>

      <Card className="bg-card/50 border-border/50 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="font-rajdhani uppercase tracking-widest text-primary font-bold mb-1">
                {race.seasons?.championships?.name} - {race.seasons?.name} | Etapa {race.round_number || '-'}
              </CardDescription>
              <CardTitle className="text-3xl font-orbitron uppercase">{race.name}</CardTitle>
            </div>
            {currentStatus === 'CONFIRMED' && (
              <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-full flex items-center gap-2 font-rajdhani font-bold">
                <CheckCircle2 className="w-5 h-5" /> CONFIRMADO
              </div>
            )}
            {currentStatus === 'ABSENT' && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-full flex items-center gap-2 font-rajdhani font-bold">
                <XCircle className="w-5 h-5" /> AUSENTE
              </div>
            )}
            {currentStatus === 'AVAILABLE' && (
              <div className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-full flex items-center gap-2 font-rajdhani font-bold">
                <CheckCircle2 className="w-5 h-5" /> DISPONÍVEL (RESERVA)
              </div>
            )}
            {currentStatus === 'PENDING' && (
              <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-full flex items-center gap-2 font-rajdhani font-bold">
                <AlertCircle className="w-5 h-5" /> PENDENTE
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/50">
              <Calendar className="w-8 h-8 text-primary opacity-80" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-exo2 font-bold">Data da Corrida</p>
                <p className="text-lg font-rajdhani font-bold">{raceDate.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/50">
              <MapPin className="w-8 h-8 text-primary opacity-80" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-exo2 font-bold">Circuito</p>
                <p className="text-lg font-rajdhani font-bold">{race.circuit}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/20 p-5 rounded-lg border border-border/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="font-orbitron font-bold text-lg">SUA PRESENÇA</h3>
            </div>
            
            {isPastDeadline ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded border border-destructive/20 font-exo2">
                <strong>O prazo para alterações encerrou!</strong> O status de presença só poderia ser alterado até 2 horas antes da corrida.
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-exo2">
                Por favor, informe seu status para a corrida. Você pode alterar essa opção até <strong className="text-foreground">{deadlineTime.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong>.
              </p>
            )}

            {isReserve && currentStatus === 'AVAILABLE' && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mt-2 mb-4">
                {attendance?.assigned_team_id ? (
                  <div>
                    <p className="text-sm font-exo2 text-primary font-bold">PARABÉNS! VOCÊ FOI CONVOCADO!</p>
                    <p className="text-lg font-rajdhani font-bold text-foreground">
                      Você correrá esta etapa substituindo pela equipe <span className="text-primary">{attendance.teams?.name || 'Desconhecida'}</span>.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-exo2 text-yellow-500 font-bold">FILA DE ESPERA</p>
                    <p className="text-sm font-rajdhani text-muted-foreground">
                      No momento não há vagas disponíveis. Você está na fila de espera. Se um titular informar ausência, o primeiro da fila será convocado automaticamente.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-2">
              {!isReserve ? (
                <>
                  <Button 
                    onClick={() => handleUpdateStatus('CONFIRMED')} 
                    disabled={actionLoading || isPastDeadline || currentStatus === 'CONFIRMED'}
                    className="bg-green-600 hover:bg-green-700 text-white font-rajdhani font-bold tracking-wider"
                    size="lg"
                  >
                    CONFIRMAR PRESENÇA
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus('ABSENT')} 
                    disabled={actionLoading || isPastDeadline || currentStatus === 'ABSENT'}
                    variant="destructive"
                    className="font-rajdhani font-bold tracking-wider"
                    size="lg"
                  >
                    INFORMAR AUSÊNCIA
                  </Button>
                  {currentStatus !== 'PENDING' && (
                    <Button 
                      onClick={() => handleUpdateStatus('PENDING')} 
                      disabled={actionLoading || isPastDeadline}
                      variant="outline"
                      className="font-rajdhani font-bold tracking-wider"
                      size="lg"
                    >
                      REMOVER RESPOSTA
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => handleUpdateStatus('AVAILABLE')} 
                    disabled={actionLoading || isPastDeadline || currentStatus === 'AVAILABLE'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-rajdhani font-bold tracking-wider"
                    size="lg"
                  >
                    ESTOU DISPONÍVEL (RESERVA)
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus('ABSENT')} 
                    disabled={actionLoading || isPastDeadline || currentStatus === 'ABSENT'}
                    variant="destructive"
                    className="font-rajdhani font-bold tracking-wider"
                    size="lg"
                  >
                    NÃO ESTAREI DISPONÍVEL
                  </Button>
                  {currentStatus !== 'PENDING' && (
                    <Button 
                      onClick={() => handleUpdateStatus('PENDING')} 
                      disabled={actionLoading || isPastDeadline}
                      variant="outline"
                      className="font-rajdhani font-bold tracking-wider"
                      size="lg"
                    >
                      REMOVER RESPOSTA
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
