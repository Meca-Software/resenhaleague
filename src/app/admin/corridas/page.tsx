"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Flag, Plus, Edit, ListOrdered, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const f1Calendar2026 = [
  { track: "Albert Park Circuit", country: "AU" },
  { track: "Shanghai International Circuit", country: "CN" },
  { track: "Suzuka International Racing Course", country: "JP" },
  { track: "Bahrain International Circuit", country: "BH" },
  { track: "Jeddah Corniche Circuit", country: "SA" },
  { track: "Miami International Autodrome", country: "US" },
  { track: "Autodromo Enzo e Dino Ferrari", country: "IT" },
  { track: "Circuit de Monaco", country: "MC" },
  { track: "Circuit Gilles Villeneuve", country: "CA" },
  { track: "IFEMA Madrid Circuit", country: "ES" },
  { track: "Circuit de Barcelona-Catalunya", country: "ES" },
  { track: "Red Bull Ring", country: "AT" },
  { track: "Silverstone Circuit", country: "GB" },
  { track: "Hungaroring", country: "HU" },
  { track: "Circuit de Spa-Francorchamps", country: "BE" },
  { track: "Circuit Zandvoort", country: "NL" },
  { track: "Autodromo Nazionale Monza", country: "IT" },
  { track: "Baku City Circuit", country: "AZ" },
  { track: "Marina Bay Street Circuit", country: "SG" },
  { track: "Circuit of the Americas", country: "US" },
  { track: "Autódromo Hermanos Rodríguez", country: "MX" },
  { track: "Interlagos Circuit", country: "BR" },
  { track: "Las Vegas Strip Circuit", country: "US" },
  { track: "Lusail International Circuit", country: "QA" },
  { track: "Yas Marina Circuit", country: "AE" }
];

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return "";
  if (countryCode.length > 2) return "";
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

export default function AdminCorridasPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreatingRace, setIsCreatingRace] = useState(false);
  const [raceToDelete, setRaceToDelete] = useState<any>(null);
  const [raceToEdit, setRaceToEdit] = useState<any>(null);

  // Form Race
  const [raceSeasonId, setRaceSeasonId] = useState("");
  const [newRaces, setNewRaces] = useState<any[]>([]);

  const handleAddMoreRaces = () => {
    setNewRaces([...newRaces, {
      id: Date.now().toString(),
      round_number: (newRaces.length + 1).toString(),
      track_name: "",
      country_code: "BR",
      race_date: "",
      status: "upcoming",
      has_sprint: false
    }]);
  };

  const handleAddF1Race = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTrack = e.target.value;
    if (!selectedTrack) return;
    
    const f1Race = f1Calendar2026.find(r => r.track === selectedTrack);
    if (f1Race) {
      setNewRaces([...newRaces, {
        id: Date.now().toString(),
        round_number: (newRaces.length + 1).toString(),
        track_name: f1Race.track,
        country_code: f1Race.country,
        race_date: "",
        status: "upcoming",
        has_sprint: false
      }]);
    }
    e.target.value = "";
  };

  const handleRemoveRaceForm = (id: string) => {
    setNewRaces(newRaces.filter(r => r.id !== id));
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch Seasons para o select
    const { data: seasonsData } = await supabase.from('seasons').select('*, championships(name)').order('created_at', { ascending: false });
    if (seasonsData) setSeasons(seasonsData);

    // Fetch Races
    const { data: racesData } = await supabase.from('races').select('*, seasons(name, championships(name))').order('race_date', { ascending: true });
    if (racesData) setRaces(racesData);

    setIsLoading(false);
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch("https://flagcdn.com/pt/codes.json");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      
      const countriesArray = Object.keys(data).map(code => {
        if (code.length > 2) return null; // Ignorar estados/regiões
        const upperCode = code.toUpperCase();
        const flagEmoji = upperCode.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
        return {
          code: upperCode,
          name: data[code],
          flag: flagEmoji
        };
      }).filter(Boolean) as any[];

      const sorted = countriesArray.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sorted);
    } catch (error) {
      console.error("Erro ao buscar países:", error);
      // Fallback manual para as principais corridas caso a API seja bloqueada pelo navegador
      setCountries([
        { code: "BR", name: "Brasil", flag: "🇧🇷" },
        { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
        { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
        { code: "IT", name: "Itália", flag: "🇮🇹" },
        { code: "AE", name: "Emirados Árabes Unidos", flag: "🇦🇪" },
        { code: "BH", name: "Bahrein", flag: "🇧🇭" },
        { code: "SA", name: "Arábia Saudita", flag: "🇸🇦" },
        { code: "JP", name: "Japão", flag: "🇯🇵" },
        { code: "MC", name: "Mônaco", flag: "🇲🇨" },
        { code: "ES", name: "Espanha", flag: "🇪🇸" },
        { code: "PT", name: "Portugal", flag: "🇵🇹" },
        { code: "NL", name: "Holanda", flag: "🇳🇱" },
        { code: "FR", name: "França", flag: "🇫🇷" }
      ]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCountries();
  }, []);

  const handleCreateRace = async () => {
    if (!raceSeasonId) return toast.error("Selecione a temporada!");
    if (newRaces.length === 0) return toast.success("Adicione pelo menos uma etapa!");

    for (let i = 0; i < newRaces.length; i++) {
      const r = newRaces[i];
      if (!r.round_number) return toast.success(`Etapa ${i + 1} (Circuito: ${r.track_name || 'Vazio'}): Preencha o número da etapa`);
      if (!r.track_name) return toast.error(`Etapa ${i + 1}: Preencha o nome do circuito`);
      if (!r.country_code) return toast.success(`Etapa ${i + 1} (Circuito: ${r.track_name}): Selecione o país`);
      if (!r.race_date) return toast.success(`Etapa ${i + 1} (Circuito: ${r.track_name}): Preencha a Data e Hora`);
      if (!r.status) return toast.success(`Etapa ${i + 1} (Circuito: ${r.track_name}): Selecione o status`);
    }

    const racesToInsert = newRaces.map(r => ({
      name: `Etapa ${r.round_number} - ${r.track_name}`,
      circuit: r.track_name,
      season_id: raceSeasonId,
      round_number: parseInt(r.round_number),
      track_name: r.track_name,
      country_code: r.country_code,
      race_date: new Date(r.race_date).toISOString(),
      status: r.status,
      has_sprint: r.has_sprint
    }));

    const { error } = await supabase.from('races').insert(racesToInsert);

    if (error) return toast.error(error.message);
    
    setNewRaces([]);
    setRaceSeasonId("");
    setIsCreatingRace(false);
    fetchData();
  };

  const handleDeleteRace = async () => {
    if (!raceToDelete) return;

    try {
      // Force delete: apagar dados relacionados primeiro para evitar bloqueios de FK
      await supabase.from('race_attendances').delete().eq('race_id', raceToDelete.id);
      await supabase.from('qualifying_results').delete().eq('race_id', raceToDelete.id);
      await supabase.from('race_results').delete().eq('race_id', raceToDelete.id);
      await supabase.from('incidents').delete().eq('race_id', raceToDelete.id);
      
      const { data, error } = await supabase.from('races').delete().eq('id', raceToDelete.id).select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Permissão negada pelo banco (RLS) ou corrida não encontrada. Nada foi apagado.");
      }
      
      toast.success("Corrida apagada com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao apagar: " + error.message);
    }
    
    setRaceToDelete(null);
  };

  const handleUpdateRace = async () => {
    if (!raceToEdit) return;
    
    try {
      let parsedDate = null;
      if (raceToEdit.race_date) {
        parsedDate = new Date(raceToEdit.race_date).toISOString();
      }

      const { data, error } = await supabase.from('races').update({
        name: `Etapa ${raceToEdit.round_number} - ${raceToEdit.track_name}`,
        circuit: raceToEdit.track_name,
        track_name: raceToEdit.track_name,
        country_code: raceToEdit.country_code,
        race_date: parsedDate,
        status: raceToEdit.status,
        has_sprint: raceToEdit.has_sprint,
        round_number: parseInt(raceToEdit.round_number)
      }).eq('id', raceToEdit.id).select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Permissão negada pelo banco (RLS) ou corrida não encontrada. Nada foi alterado.");
      }

      toast.success("Corrida atualizada com sucesso!");
      fetchData();
      setRaceToEdit(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000; 
    return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Flag className="w-8 h-8 text-primary" /> CORRIDAS E RESULTADOS
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Gerencie o calendário oficial no Supabase e prepare os resultados.
          </p>
        </div>
        <Button className="font-rajdhani font-bold" onClick={() => setIsCreatingRace(!isCreatingRace)}>
          <Plus className="w-4 h-4 mr-2" /> ADICIONAR ETAPA
        </Button>
      </div>

      {isCreatingRace && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Cadastrar Calendário de Etapas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 font-exo2">
              <label className="text-sm font-rajdhani uppercase font-bold text-muted-foreground mb-2 block">1. Selecione a Temporada</label>
              <select value={raceSeasonId} onChange={(e) => setRaceSeasonId(e.target.value)} className="flex h-10 w-full md:w-1/3 rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="">Selecione...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.championships?.name} - {s.name}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                <label className="text-sm font-rajdhani uppercase font-bold text-muted-foreground block">2. Adicione as Corridas</label>
              </div>
              
              <div className="space-y-4">
                {newRaces.map((race, index) => (
                  <div key={race.id} className="p-4 rounded-lg border border-border/30 bg-background/30 flex flex-col lg:flex-row gap-4 items-center relative">
                    <div className="w-full lg:w-[8%]">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground">Etapa</label>
                      <Input type="number" value={race.round_number} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].round_number = e.target.value;
                        setNewRaces(updated);
                      }} className="bg-background/80" />
                    </div>
                    <div className="w-full lg:w-[22%]">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground">País (Bandeira)</label>
                      <select value={race.country_code} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].country_code = e.target.value;
                        setNewRaces(updated);
                      }} className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full lg:w-[25%]">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground">Circuito (Track)</label>
                      <Input value={race.track_name} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].track_name = e.target.value;
                        setNewRaces(updated);
                      }} placeholder="Ex: Interlagos" className="bg-background/80" />
                    </div>
                    <div className="w-full lg:w-[20%]">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground">Data e Hora</label>
                      <Input type="datetime-local" value={race.race_date} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].race_date = e.target.value;
                        setNewRaces(updated);
                      }} className="bg-background/80" />
                    </div>
                    <div className="w-full lg:w-[15%]">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground">Status</label>
                      <select value={race.status} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].status = e.target.value;
                        setNewRaces(updated);
                      }} className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <option value="upcoming">Agendada</option>
                        <option value="completed">Finalizada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                    
                    <div className="w-full lg:w-[10%] flex flex-col justify-center items-center">
                      <label className="text-xs font-rajdhani uppercase text-muted-foreground mb-2">Sprint?</label>
                      <input type="checkbox" checked={race.has_sprint} onChange={(e) => {
                        const updated = [...newRaces];
                        updated[index].has_sprint = e.target.checked;
                        setNewRaces(updated);
                      }} className="w-5 h-5 accent-primary" />
                    </div>

                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20 h-10 w-10 shrink-0 absolute top-2 right-2 lg:relative lg:top-auto lg:right-auto mt-4 lg:mt-0" onClick={() => handleRemoveRaceForm(race.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col md:flex-row gap-4">
                <select onChange={handleAddF1Race} defaultValue="" className="flex h-10 w-full md:w-1/2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <option value="">+ Adicionar Circuito Oficial da F1...</option>
                  {f1Calendar2026.map(r => (
                    <option key={r.track} value={r.track}>{getFlagEmoji(r.country)} {r.track}</option>
                  ))}
                </select>

                <Button variant="outline" className="w-full md:w-1/2 border-dashed border-border text-muted-foreground hover:bg-muted" onClick={handleAddMoreRaces}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Etapa
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-border/30">
              <Button variant="ghost" onClick={() => {
                setIsCreatingRace(false);
                setNewRaces([]);
              }}>Cancelar</Button>
              <Button onClick={handleCreateRace} className="bg-green-600 hover:bg-green-700 font-bold">Salvar Todas as Corridas</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">Calendário de Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando calendário do Supabase...</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>TEMPORADA</TableHead>
                  <TableHead>ETAPA</TableHead>
                  <TableHead>PAÍS</TableHead>
                  <TableHead>CIRCUITO</TableHead>
                  <TableHead className="text-center">DATA</TableHead>
                  <TableHead className="text-center">SPRINT</TableHead>
                  <TableHead className="text-center">STATUS</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {races.map((race) => (
                  <TableRow key={race.id}>
                    <TableCell className="text-muted-foreground text-sm">{race.seasons?.championships?.name} - {race.seasons?.name}</TableCell>
                    <TableCell className="font-bold font-orbitron">R{race.round_number < 10 ? `0${race.round_number}` : race.round_number}</TableCell>
                    <TableCell>
                      {race.country_code ? (
                        <div className="flex items-center gap-2">
                          <img src={`https://flagcdn.com/w20/${race.country_code.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w40/${race.country_code.toLowerCase()}.png 2x`} width="20" alt={race.country_code} className="rounded-sm" />
                          <span className="text-xs text-muted-foreground">{race.country_code}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{race.track_name}</TableCell>
                    <TableCell className="text-center">{new Date(race.race_date).toLocaleDateString('pt-BR')} às {new Date(race.race_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                    <TableCell className="text-center">
                      {race.has_sprint ? (
                        <Badge variant="outline" className="text-orange-500 border-orange-500 bg-orange-500/10">SPRINT</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={race.status === "completed" ? "text-muted-foreground border-border" : "text-primary border-primary animate-pulse"}>
                        {race.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setRaceToEdit({...race, race_date: formatDateForInput(race.race_date)})} className="text-primary hover:text-primary/80"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setRaceToDelete(race)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {races.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma corrida cadastrada no calendário.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!raceToDelete} onOpenChange={(open) => !open && setRaceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive font-orbitron">Aviso: Apagar Corrida</DialogTitle>
            <DialogDescription className="text-base text-foreground/80 mt-2">
              Você tem certeza que deseja apagar a corrida <strong>{raceToDelete?.track_name}</strong>?
            </DialogDescription>
            <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 mt-4">
              <p className="text-destructive font-bold text-sm">
                Atenção: Ao confirmar, você perderá TODO o histórico desta corrida, incluindo:
              </p>
              <ul className="list-disc list-inside text-destructive/80 text-sm mt-2">
                <li>Confirmações de presença</li>
                <li>Resultados de qualificação e corrida</li>
                <li>Punições e incidentes relatados</li>
              </ul>
              <p className="text-destructive/80 text-sm mt-2">Esta ação não pode ser desfeita.</p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRaceToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteRace}>Apagar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!raceToEdit} onOpenChange={(open) => !open && setRaceToEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Corrida</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na etapa.
            </DialogDescription>
          </DialogHeader>
          {raceToEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Etapa (Número)</Label>
                <Input type="number" value={raceToEdit.round_number} onChange={(e) => setRaceToEdit({...raceToEdit, round_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <select value={raceToEdit.country_code} onChange={(e) => setRaceToEdit({...raceToEdit, country_code: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Circuito</Label>
                <Input value={raceToEdit.track_name} onChange={(e) => setRaceToEdit({...raceToEdit, track_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input type="datetime-local" value={raceToEdit.race_date} onChange={(e) => setRaceToEdit({...raceToEdit, race_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={raceToEdit.status} onChange={(e) => setRaceToEdit({...raceToEdit, status: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="upcoming">Agendada</option>
                  <option value="completed">Finalizada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <Label className="mb-2">Sprint?</Label>
                <input type="checkbox" checked={raceToEdit.has_sprint} onChange={(e) => setRaceToEdit({...raceToEdit, has_sprint: e.target.checked})} className="w-5 h-5 accent-primary" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRaceToEdit(null)}>Cancelar</Button>
            <Button onClick={handleUpdateRace} className="bg-primary hover:bg-primary/90">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
