"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, AlertTriangle, ExternalLink, CheckCircle, XCircle, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function StewardsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for resolution
  const [penalty, setPenalty] = useState("none");
  const [licensePoints, setLicensePoints] = useState("");
  const [officialDecision, setOfficialDecision] = useState("");

  const fetchIncidents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        reporter:reporting_pilot_id(name, teams(name)),
        involved:involved_pilot_id(name, teams(name)),
        races(name)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      } else if (selectedIncident) {
        // Update selected incident with new data
        const updated = data.find(i => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleResolveIncident = async (action: 'resolved' | 'dismissed') => {
    if (!selectedIncident) return;
    
    if (action === 'resolved' && !officialDecision) {
      return toast.success("Forneça a justificativa oficial para aplicar o veredito.");
    }

    const { error } = await supabase.from('incidents')
      .update({
        status: action,
        penalty: action === 'dismissed' ? 'none' : penalty,
        license_points: action === 'dismissed' ? 0 : (parseInt(licensePoints) || 0),
        official_decision: action === 'dismissed' ? 'Incidente rejeitado ou considerado improcedente.' : officialDecision,
        resolved_at: new Date().toISOString()
      })
      .eq('id', selectedIncident.id);

    if (error) {
      toast.error("Erro ao julgar: " + error.message);
    } else {
      toast.success("Veredito aplicado com sucesso!");
      setPenalty("none");
      setLicensePoints("");
      setOfficialDecision("");
      fetchIncidents();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
          <Gavel className="w-8 h-8 text-primary" /> CENTRO DE COMISSÁRIOS
        </h1>
        <p className="text-muted-foreground font-exo2 mt-1">
          Painel de julgamento de incidentes. Selecione um caso para analisar as evidências e aplicar penalidades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* COLUNA ESQUERDA: LISTA DE INCIDENTES (1/3 DA TELA) */}
        <Card className="lg:col-span-4 bg-card/40 border-border/50 backdrop-blur-md shadow-lg flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border/40 bg-muted/20 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar incidente ou piloto..." className="pl-9 font-exo2 bg-background/50 h-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="font-exo2 text-xs flex-1 border-amber-500/50 text-amber-500 bg-amber-500/10">Pendentes ({incidents.filter(i => i.status === 'pending' || i.status === 'investigating').length})</Button>
              <Button variant="ghost" size="sm" className="font-exo2 text-xs flex-1">Julgados</Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground font-exo2 text-sm">
                Nenhum incidente reportado no momento.
              </div>
            ) : (
              incidents.map((incident) => (
                <div 
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedIncident?.id === incident.id 
                      ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.1)]" 
                      : "border-border/40 bg-background/30 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-orbitron font-bold text-sm truncate max-w-[120px]">{incident.id.split('-')[0] + '...'}</span>
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider py-0 h-5 ${
                      incident.status === 'pending' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                      incident.status === 'resolved' ? 'border-green-500 text-green-500 bg-green-500/10' :
                      'border-gray-500 text-gray-500 bg-gray-500/10'
                    }`}>
                      {incident.status === 'pending' ? 'Em Análise' : incident.status}
                    </Badge>
                  </div>
                  <div className="font-rajdhani font-bold text-sm truncate">{incident.races?.name || 'Corrida Desconhecida'} - Volta {incident.lap || '?'}</div>
                  <p className="text-xs text-muted-foreground font-exo2 mt-1 truncate">Denunciante: {incident.reporter?.name?.split(' ')[0] || 'Desconhecido'}</p>
                  <p className="text-xs text-muted-foreground font-exo2 truncate">Envolvido: {incident.involved?.name?.split(' ')[0] || 'Desconhecido'}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* COLUNA DIREITA: DETALHES DO INCIDENTE (2/3 DA TELA) */}
        <Card className="lg:col-span-8 bg-card/40 border-border/50 backdrop-blur-md shadow-lg flex flex-col h-full overflow-hidden relative">
          {!selectedIncident ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Gavel className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-orbitron text-lg">Selecione um incidente para julgar</p>
            </div>
          ) : (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-500 to-amber-700"></div>
              
              {/* Header do Incidente */}
              <div className="p-6 border-b border-border/40 bg-muted/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-orbitron font-bold flex items-center gap-2">
                      <span className="truncate max-w-[150px] inline-block" title={selectedIncident.id}>{selectedIncident.id.split('-')[0] + '...'}</span> 
                      <span className="text-muted-foreground font-light text-lg truncate">| {selectedIncident.races?.name || 'Corrida Desconhecida'}</span>
                    </h2>
                    <p className="text-sm font-exo2 text-muted-foreground mt-1">Data da ocorrência: {new Date(selectedIncident.created_at).toLocaleDateString('pt-BR')} - Incidente na Volta {selectedIncident.lap || '?'}</p>
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 text-xs uppercase tracking-widest font-rajdhani ${
                      selectedIncident.status === 'pending' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                      selectedIncident.status === 'resolved' ? 'border-green-500 text-green-500 bg-green-500/10' :
                      'border-gray-500 text-gray-500 bg-gray-500/10'
                  }`}>
                    {selectedIncident.status}
                  </Badge>
                </div>
              </div>

              {/* Corpo do Incidente (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Pilotos Envolvidos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/40 bg-background/50">
                    <div className="text-xs font-rajdhani font-bold text-muted-foreground uppercase tracking-wider mb-1">Denunciante (Vítima)</div>
                    <div className="font-exo2 font-bold text-lg text-primary">{selectedIncident.reporter?.name || 'Desconhecido'}</div>
                    <div className="text-xs text-muted-foreground">{selectedIncident.reporter?.teams?.name || 'Sem Equipe'}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                    <div className="text-xs font-rajdhani font-bold text-destructive uppercase tracking-wider mb-1">Piloto Acusado</div>
                    <div className="font-exo2 font-bold text-lg text-destructive">{selectedIncident.involved?.name || 'Desconhecido'}</div>
                    <div className="text-xs text-destructive/70">{selectedIncident.involved?.teams?.name || 'Sem Equipe'}</div>
                  </div>
                </div>

                {/* Descrição e Evidência */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-rajdhani font-bold text-base text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" /> Alegação do Denunciante
                    </h3>
                    <div className="p-4 rounded-xl border border-border/40 bg-muted/20 font-exo2 text-sm leading-relaxed text-muted-foreground">
                      "{selectedIncident.description}"
                    </div>
                  </div>

                  <div>
                    <h3 className="font-rajdhani font-bold text-base text-foreground uppercase tracking-wider mb-2">Evidência em Vídeo</h3>
                    <div className="p-4 rounded-xl border border-border/40 bg-background/50 flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                        <ExternalLink className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-exo2 text-sm text-center mb-4 max-w-md text-muted-foreground">
                        O vídeo foi enviado através de uma plataforma externa (YouTube/Drive). Clique no botão abaixo para assistir à evidência em uma nova aba.
                      </p>
                      <Button onClick={() => window.open(selectedIncident.video_url || '#', '_blank')} disabled={!selectedIncident.video_url} className="font-rajdhani font-bold tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                        ASSISTIR VÍDEO COMPLETO
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Área de Decisão */}
                <div className="border-t border-border/40 pt-6">
                  <h3 className="font-rajdhani font-bold text-lg text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-primary" /> Parecer e Veredito
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-rajdhani font-bold text-muted-foreground uppercase">Penalidade a aplicar</label>
                        <Select value={penalty} onValueChange={(val) => val && setPenalty(val)}>
                          <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-10">
                            <SelectValue placeholder="Nenhuma penalidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Incidente de Corrida (Sem Punição)</SelectItem>
                            <SelectItem value="time_3s">Penalidade de Tempo (3s)</SelectItem>
                            <SelectItem value="time_5s">Penalidade de Tempo (5s)</SelectItem>
                            <SelectItem value="time_10s">Penalidade de Tempo (10s)</SelectItem>
                            <SelectItem value="grid_3">Perda de Posições no Grid (3)</SelectItem>
                            <SelectItem value="dsq">Desclassificação da Etapa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-rajdhani font-bold text-muted-foreground uppercase">Pontos na Licença</label>
                        <Input 
                          type="number" min="0" max="10" placeholder="Ex: 2" 
                          className="font-exo2 bg-background/50 border-border/50 h-10" 
                          value={licensePoints} onChange={(e) => setLicensePoints(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-rajdhani font-bold text-muted-foreground uppercase">Justificativa Oficial</label>
                      <Textarea 
                        rows={3}
                        value={officialDecision} onChange={(e) => setOfficialDecision(e.target.value)}
                        placeholder="Escreva a justificativa que será publicada no painel de notícias..." 
                        className="font-exo2 bg-background/50 border-border/50 resize-none text-sm" 
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Botões de Ação (Rodapé fixo) */}
              {selectedIncident.status === 'pending' || selectedIncident.status === 'investigating' ? (
                <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md flex justify-end gap-4 mt-auto">
                  <Button onClick={() => handleResolveIncident('dismissed')} variant="outline" className="font-rajdhani font-bold tracking-widest text-destructive hover:text-white hover:bg-destructive border-destructive/50">
                    <XCircle className="w-4 h-4 mr-2" /> REJEITAR / IMPROCEDENTE
                  </Button>
                  <Button onClick={() => handleResolveIncident('resolved')} className="font-rajdhani font-bold tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
                    <CheckCircle className="w-4 h-4 mr-2" /> APLICAR VEREDITO
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md flex justify-end gap-4 mt-auto">
                  <p className="font-rajdhani font-bold tracking-widest text-muted-foreground flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> INCIDENTE RESOLVIDO
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

      </div>
    </div>
  );
}
