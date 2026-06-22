"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { FileSpreadsheet, Save, Loader2, Award, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminResultadosPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState("");

  const [pilots, setPilots] = useState<any[]>([]);
  const [resultsForm, setResultsForm] = useState<Record<string, any>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar Temporadas iniciais
  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('seasons').select('id, name, championships(name)');
      if (data) setSeasons(data);
      setIsLoading(false);
    };
    fetchSeasons();
  }, []);

  // Quando seleciona uma temporada, busca Corridas e Pilotos vinculados
  useEffect(() => {
    if (!selectedSeason) {
      setRaces([]);
      setPilots([]);
      setSelectedRace("");
      return;
    }

    const fetchSeasonData = async () => {
      setIsLoading(true);
      const [racesRes, pilotsRes] = await Promise.all([
        supabase.from('races').select('*').eq('season_id', selectedSeason).order('round_number', { ascending: true }),
        supabase.from('pilots').select('id, name, number, teams(name, color)').eq('season_id', selectedSeason).order('name', { ascending: true })
      ]);

      if (racesRes.data) setRaces(racesRes.data);
      if (pilotsRes.data) setPilots(pilotsRes.data);
      setIsLoading(false);
    };
    
    fetchSeasonData();
    setSelectedRace(""); // Reset da corrida
  }, [selectedSeason]);

  // Quando seleciona uma corrida, busca se já tem resultados salvos
  useEffect(() => {
    if (!selectedRace) {
      setResultsForm({});
      return;
    }

    const fetchRaceResults = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('race_results').select('*').eq('race_id', selectedRace);
      
      const newForm: Record<string, any> = {};
      
      // Inicializa o formulário com dados existentes ou vazio
      pilots.forEach(pilot => {
        const existing = data?.find(r => r.pilot_id === pilot.id);
        if (existing) {
          newForm[pilot.id] = {
            position: existing.position?.toString() || "",
            points: existing.points?.toString() || "0",
            status: existing.status || "finished",
            fastest_lap: existing.fastest_lap || false
          };
        } else {
          newForm[pilot.id] = {
            position: "",
            points: "0",
            status: "finished",
            fastest_lap: false
          };
        }
      });
      
      setResultsForm(newForm);
      setIsLoading(false);
    };
    
    fetchRaceResults();
  }, [selectedRace, pilots]);

  const handleUpdateField = (pilotId: string, field: string, value: any) => {
    setResultsForm(prev => ({
      ...prev,
      [pilotId]: {
        ...prev[pilotId],
        [field]: value
      }
    }));
  };

  const handleSaveResults = async () => {
    if (!selectedRace) return;
    setIsSaving(true);
    
    // Primeiro deleta os resultados antigos dessa corrida
    await supabase.from('race_results').delete().eq('race_id', selectedRace);

    // Formata o array para salvar
    const toInsert = Object.keys(resultsForm).map(pilotId => ({
      race_id: selectedRace,
      pilot_id: pilotId,
      position: resultsForm[pilotId].position ? parseInt(resultsForm[pilotId].position) : null,
      points: parseInt(resultsForm[pilotId].points) || 0,
      status: resultsForm[pilotId].status,
      fastest_lap: resultsForm[pilotId].fastest_lap
    }));

    const { error } = await supabase.from('race_results').insert(toInsert);
    
    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Resultados salvos com sucesso!");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-primary" /> RESULTADOS DE CORRIDA
        </h1>
        <p className="text-muted-foreground font-exo2 mt-1">
          Atribua posições, pontos e penalidades aos pilotos por corrida.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-lg">1. Selecione a Temporada</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !seasons.length ? (
              <p className="text-muted-foreground text-sm flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando...</p>
            ) : (
              <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="">Escolha a temporada...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.championships?.name} - {s.name}</option>)}
              </select>
            )}
          </CardContent>
        </Card>

        <Card className={`bg-card/50 border-border/50 transition-opacity ${!selectedSeason ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle className="font-orbitron text-lg">2. Selecione a Etapa (Corrida)</CardTitle>
          </CardHeader>
          <CardContent>
            <select value={selectedRace} onChange={(e) => setSelectedRace(e.target.value)} className="flex h-10 w-full rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" disabled={!selectedSeason}>
              <option value="">Escolha a etapa...</option>
              {races.map(r => <option key={r.id} value={r.id}>Round {r.round_number}: {r.track_name}</option>)}
            </select>
          </CardContent>
        </Card>
      </div>

      {selectedRace && (
        <Card className="bg-card/50 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Tabela de Resultados
            </CardTitle>
            <Button onClick={handleSaveResults} disabled={isSaving} className="bg-green-600 hover:bg-green-700 font-bold">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
              SALVAR RESULTADOS
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {pilots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-exo2 flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500/50" />
                <p>Nenhum piloto está vinculado a esta temporada.</p>
                <p className="text-sm">Vá até "Pilotos & Equipes" e adicione pilotos para esta temporada.</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 font-rajdhani">
                    <TableRow>
                      <TableHead>Piloto / Equipe</TableHead>
                      <TableHead className="w-24 text-center">Posição</TableHead>
                      <TableHead className="w-24 text-center">Pontos</TableHead>
                      <TableHead className="w-32 text-center">Status</TableHead>
                      <TableHead className="w-24 text-center">V. Rápida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-exo2">
                    {pilots.map(pilot => {
                      const f = resultsForm[pilot.id];
                      if (!f) return null;
                      
                      return (
                        <TableRow key={pilot.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell>
                            <div className="font-bold text-base flex items-center gap-2">
                              {pilot.name} <span className="text-muted-foreground text-xs font-orbitron">#{pilot.number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              {pilot.teams ? (
                                <>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pilot.teams.color }}></span>
                                  {pilot.teams.name}
                                </>
                              ) : "Sem equipe"}
                            </div>
                          </TableCell>
                          
                          {/* Posição */}
                          <TableCell>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="Pos" 
                              className="text-center bg-background/50 border-border/50 h-9"
                              value={f.position}
                              onChange={(e) => handleUpdateField(pilot.id, 'position', e.target.value)}
                            />
                          </TableCell>

                          {/* Pontos */}
                          <TableCell>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="Pts" 
                              className="text-center font-bold bg-background/50 border-primary/30 h-9"
                              value={f.points}
                              onChange={(e) => handleUpdateField(pilot.id, 'points', e.target.value)}
                            />
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <select 
                              className="flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                              value={f.status}
                              onChange={(e) => handleUpdateField(pilot.id, 'status', e.target.value)}
                            >
                              <option value="finished">🏁 Completou</option>
                              <option value="dnf">💥 DNF (Abandonou)</option>
                              <option value="dsq">⛔ DSQ (Desclassificado)</option>
                              <option value="dns">❌ DNS (Não largou)</option>
                            </select>
                          </TableCell>

                          {/* Volta Mais Rápida */}
                          <TableCell className="text-center">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-primary cursor-pointer mt-2"
                              checked={f.fastest_lap}
                              onChange={(e) => handleUpdateField(pilot.id, 'fastest_lap', e.target.checked)}
                            />
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
