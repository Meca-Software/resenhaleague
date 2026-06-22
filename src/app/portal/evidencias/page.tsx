"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileVideo, Send, ShieldAlert, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function PortalEvidenciasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myPilotId, setMyPilotId] = useState<string | null>(null);
  
  const [races, setRaces] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [pastIncidents, setPastIncidents] = useState<any[]>([]);

  // Form State
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [selectedPilotIds, setSelectedPilotIds] = useState<string[]>([""]);
  const [lapNumber, setLapNumber] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");

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
      setMyPilotId(myPilot.id);

      // Pega as corridas da mesma temporada
      if (myPilot.season_id) {
        const { data: racesData } = await supabase
          .from('races')
          .select('*')
          .eq('season_id', myPilot.season_id)
          .order('race_date', { ascending: false });
        if (racesData) setRaces(racesData);

        // Pega todos os pilotos da temporada (exceto o próprio usuário)
        const { data: pilotsData } = await supabase
          .from('pilots')
          .select('id, name, teams(name)')
          .eq('season_id', myPilot.season_id)
          .neq('id', myPilot.id)
          .order('name', { ascending: true });
        if (pilotsData) setPilots(pilotsData);
      }

      // Pega o histórico de incidentes reportados por este piloto
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('*, involved:involved_pilot_id(name), races(name, track_name)')
        .eq('reporting_pilot_id', myPilot.id)
        .order('created_at', { ascending: false });
      
      if (incidentsData) setPastIncidents(incidentsData);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPilot = () => {
    setSelectedPilotIds([...selectedPilotIds, ""]);
  };

  const handleRemovePilot = (index: number) => {
    const newArr = [...selectedPilotIds];
    newArr.splice(index, 1);
    setSelectedPilotIds(newArr);
  };

  const handleUpdatePilot = (index: number, value: string) => {
    const newArr = [...selectedPilotIds];
    newArr[index] = value;
    setSelectedPilotIds(newArr);
  };

  const handleSubmit = async () => {
    if (!myPilotId) {
      return toast.error("Você precisa ser um piloto cadastrado para reportar incidentes.");
    }
    if (!selectedRaceId || !lapNumber || !videoUrl || !description) {
      return toast.success("Por favor, preencha todos os campos obrigatórios (Corrida, Volta, Link e Descrição).");
    }

    const validPilots = selectedPilotIds.filter(id => id.trim() !== "");
    if (validPilots.length === 0) {
      return toast.success("Por favor, selecione pelo menos um piloto envolvido.");
    }

    setIsSubmitting(true);
    let hasError = false;

    // Se tiver mais de um piloto selecionado, cria múltiplos chamados
    for (const pilotId of validPilots) {
      const { error } = await supabase.from('incidents').insert({
        reporting_pilot_id: myPilotId,
        involved_pilot_id: pilotId,
        race_id: selectedRaceId,
        lap: parseInt(lapNumber),
        video_url: videoUrl,
        description: description,
        status: 'pending'
      });

      if (error) {
        console.error("Erro ao reportar incidente:", error);
        hasError = true;
      }
    }

    setIsSubmitting(false);

    if (hasError) {
      toast.error("Houve um erro ao enviar uma ou mais denúncias.");
    } else {
      toast.success("Incidente(s) reportado(s) com sucesso!");
      // Resetar form
      setSelectedRaceId("");
      setSelectedPilotIds([""]);
      setLapNumber("");
      setVideoUrl("");
      setDescription("");
      // Recarregar histórico
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="font-rajdhani border-amber-500 text-amber-500 bg-amber-500/10 uppercase tracking-wider text-[10px]">Em Análise</Badge>;
      case 'investigating': return <Badge variant="outline" className="font-rajdhani border-blue-500 text-blue-500 bg-blue-500/10 uppercase tracking-wider text-[10px]">Investigando</Badge>;
      case 'resolved': return <Badge variant="outline" className="font-rajdhani border-green-500 text-green-500 bg-green-500/10 uppercase tracking-wider text-[10px]">Procedente</Badge>;
      case 'dismissed': return <Badge variant="outline" className="font-rajdhani border-destructive text-destructive bg-destructive/10 uppercase tracking-wider text-[10px]">Improcedente</Badge>;
      default: return <Badge variant="outline" className="font-rajdhani border-gray-500 text-gray-500 bg-gray-500/10 uppercase tracking-wider text-[10px]">{status}</Badge>;
    }
  };

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
        <h1 className="text-3xl font-bold font-orbitron tracking-tight">EVIDÊNCIAS E CORRIDAS</h1>
        <p className="text-muted-foreground font-exo2 mt-1">Reporte incidentes ou envie evidências solicitadas pelos comissários.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Formulário de Envio */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <CardHeader className="border-b border-border/40 pb-6">
              <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Reportar Novo Incidente
              </CardTitle>
              <CardDescription className="font-exo2">
                Preencha os detalhes abaixo com o máximo de precisão. Lembre-se: protestos frívolos podem resultar em penalizações para o próprio denunciante.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {!myPilotId ? (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-exo2">
                  Você precisa estar vinculado a um piloto para reportar incidentes.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                        Corrida
                      </Label>
                      <Select value={selectedRaceId} onValueChange={(val) => val && setSelectedRaceId(val)}>
                        <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11">
                          <span className="flex-1 text-left text-sm truncate">
                            {selectedRaceId ? (() => {
                              const r = races.find(r => r.id === selectedRaceId);
                              return r ? `${r.seasons?.name || ''} ${r.tracks?.name || r.name}` : null;
                            })() : <span className="text-muted-foreground">Selecione a corrida...</span>}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="font-exo2">
                          {races.map(race => (
                            <SelectItem key={race.id} value={race.id}>
                              {race.name || race.track_name} {race.race_date ? `(${new Date(race.race_date).toLocaleDateString('pt-BR')})` : ''}
                            </SelectItem>
                          ))}
                          {races.length === 0 && <SelectItem value="none" disabled>Nenhuma corrida cadastrada</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                          Piloto(s) Envolvido(s)
                        </Label>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAddPilot} className="h-6 px-2 text-xs text-primary hover:bg-primary/10">
                          <Plus className="w-3 h-3 mr-1" /> Adicionar Outro
                        </Button>
                      </div>
                      
                      {selectedPilotIds.map((pilotId, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 animate-in slide-in-from-top-2">
                          <Select value={pilotId} onValueChange={(val) => val && handleUpdatePilot(idx, val)}>
                            <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11 flex-1">
                              <span className="flex-1 text-left text-sm truncate">
                                {pilotId ? (() => {
                                  const p = pilots.find(p => p.id === pilotId);
                                  return p ? `${p.name} ${p.teams?.name ? `- ${p.teams.name}` : ''}` : null;
                                })() : <span className="text-muted-foreground">Selecione o piloto...</span>}
                              </span>
                            </SelectTrigger>
                            <SelectContent className="font-exo2">
                              {pilots.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} {p.teams?.name ? `- ${p.teams.name}` : ''}
                                </SelectItem>
                              ))}
                              {pilots.length === 0 && <SelectItem value="none" disabled>Nenhum piloto encontrado</SelectItem>}
                            </SelectContent>
                          </Select>
                          
                          {idx > 0 && (
                            <Button type="button" variant="outline" size="icon" onClick={() => handleRemovePilot(idx)} className="h-11 w-11 shrink-0 text-destructive border-destructive/50 hover:bg-destructive/10">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                        Volta do Incidente
                      </Label>
                      <Input 
                        type="number" min="1" placeholder="Ex: 4" 
                        value={lapNumber} onChange={(e) => setLapNumber(e.target.value)}
                        className="font-exo2 bg-background/50 border-border/50 focus-visible:ring-amber-500/50 h-11" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                        Link do Vídeo (YouTube / Drive)
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileVideo className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input 
                          placeholder="https://youtube.com/..." 
                          value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                          className="pl-10 font-exo2 bg-background/50 border-border/50 focus-visible:ring-amber-500/50 h-11" 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-exo2">Apenas links públicos ou não listados.</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                        Descrição do Ocorrido
                      </Label>
                      <Textarea 
                        rows={4}
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva detalhadamente o que aconteceu..." 
                        className="font-exo2 bg-background/50 border-border/50 resize-none focus-visible:ring-amber-500/50 text-base" 
                      />
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm font-exo2 text-amber-500/90 leading-relaxed">
                      <strong>Atenção:</strong> Certifique-se de que o vídeo mostra claramente o incidente de múltiplos ângulos (se possível). O não fornecimento de evidências claras resultará em arquivamento automático.
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full font-rajdhani font-bold text-base h-12 tracking-wide shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 bg-amber-600 hover:bg-amber-700 text-white transition-all"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
                    {isSubmitting ? "ENVIANDO..." : "ENVIAR PARA OS COMISSÁRIOS"}
                  </Button>
                </>
              )}

            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: Histórico */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg h-full max-h-[800px] flex flex-col">
            <CardHeader className="border-b border-border/40 pb-4 shrink-0">
              <CardTitle className="font-orbitron text-lg">Seus Chamados Recentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 overflow-y-auto flex-1">
              
              {pastIncidents.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground font-exo2 text-sm">
                  Nenhum chamado registrado.
                </div>
              ) : (
                pastIncidents.map(incident => (
                  <div key={incident.id} className={`p-4 rounded-xl border border-border/40 transition-colors ${
                    incident.status === 'pending' || incident.status === 'investigating' 
                      ? 'bg-background/50 hover:bg-muted/50' 
                      : 'bg-background/20 hover:bg-muted/20 opacity-70'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      {getStatusBadge(incident.status)}
                      <span className="text-xs text-muted-foreground font-exo2">
                        {new Date(incident.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-rajdhani font-bold text-sm mb-1 truncate">
                      {incident.races?.name || incident.races?.track_name || 'Corrida'} - Volta {incident.lap}
                    </h4>
                    <p className="text-xs text-muted-foreground font-exo2 line-clamp-2">
                      Envolvido: {incident.involved?.name || 'Desconhecido'}
                    </p>
                  </div>
                ))
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
