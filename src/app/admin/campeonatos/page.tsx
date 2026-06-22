"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminCampeonatosPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreatingChamp, setIsCreatingChamp] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);

  const [champName, setChampName] = useState("");

  // Form Season
  const [seasonChampId, setSeasonChampId] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [seasonStatus, setSeasonStatus] = useState("upcoming");

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch Championships
    const { data: champsData } = await supabase.from('championships').select('*').order('tier', { ascending: true });
    if (champsData) setChampionships(champsData);

    // Fetch Seasons with Championship data
    const { data: seasonsData } = await supabase.from('seasons').select('*, championships(name)').order('created_at', { ascending: false });
    if (seasonsData) setSeasons(seasonsData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateChampionship = async () => {
    if (!champName) return toast.error("Preencha o nome do campeonato");
    const { error } = await supabase.from('championships').insert([{ name: champName, tier: 1 }]);
    if (error) return toast.error(error.message);
    setChampName("");
    setIsCreatingChamp(false);
    fetchData();
  };

  const handleCreateSeason = async () => {
    if (!seasonName || !seasonChampId) return toast.error("Preencha os campos obrigatórios da temporada");
    const { error } = await supabase.from('seasons').insert([{ 
      championship_id: seasonChampId, 
      name: seasonName, 
      status: seasonStatus 
    }]);
    if (error) return toast.error(error.message);
    setSeasonName("");
    setIsCreatingSeason(false);
    fetchData();
  };

  const handleDeleteSeason = async (id: string) => {
    if(confirm("Apagar esta temporada? Isso apagará as corridas dela também.")) {
      await supabase.from('seasons').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDeleteChampionship = async (id: string) => {
    if(confirm("Apagar esta categoria? Isso pode afetar temporadas vinculadas.")) {
      const { error } = await supabase.from('championships').delete().eq('id', id);
      if (error) {
        toast.error(error.message);
      } else {
        fetchData();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" /> CAMPEONATOS
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Crie categorias (Tiers) e gerencie as temporadas no banco de dados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-rajdhani font-bold" onClick={() => {setIsCreatingChamp(!isCreatingChamp); setIsCreatingSeason(false);}}>
            + NOVA CATEGORIA
          </Button>
          <Button className="font-rajdhani font-bold" onClick={() => {setIsCreatingSeason(!isCreatingSeason); setIsCreatingChamp(false);}}>
            <Plus className="w-4 h-4 mr-2" /> NOVA TEMPORADA
          </Button>
        </div>
      </div>

      {isCreatingChamp && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Criar Categoria Base (Ex: F1 Principal)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 font-exo2">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Nome da Categoria</label>
                <Input value={champName} onChange={(e) => setChampName(e.target.value)} placeholder="Ex: F1 Principal" className="bg-background/50 border-border/50" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreatingChamp(false)}>Cancelar</Button>
              <Button onClick={handleCreateChampionship} className="bg-green-600 hover:bg-green-700 font-bold">Salvar Categoria</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCreatingSeason && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Iniciar Nova Temporada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 font-exo2">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Categoria</label>
                <select value={seasonChampId} onChange={(e) => setSeasonChampId(e.target.value)} className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="">Selecione...</option>
                  {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Nome da Temporada</label>
                <Input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} placeholder="Ex: Temporada 10" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Status Inicial</label>
                <select value={seasonStatus} onChange={(e) => setSeasonStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="upcoming">Aguardando Início</option>
                  <option value="active">Em Andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreatingSeason(false)}>Cancelar</Button>
              <Button onClick={handleCreateSeason} className="bg-green-600 hover:bg-green-700 font-bold">Lançar Temporada</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Categorias Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando do Supabase...</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50 font-rajdhani">
                  <TableRow>
                    <TableHead>NOME DA CATEGORIA</TableHead>
                    <TableHead className="text-center">TIER</TableHead>
                    <TableHead className="text-right">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-exo2">
                  {championships.map((champ) => (
                    <TableRow key={champ.id}>
                      <TableCell className="font-bold">{champ.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{champ.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteChampionship(champ.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {championships.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma categoria registrada.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Temporadas Registradas</CardTitle>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando do Supabase...</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>CATEGORIA</TableHead>
                  <TableHead>TEMPORADA</TableHead>
                  <TableHead className="text-center">STATUS</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {seasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell className="font-bold">{season.championships?.name}</TableCell>
                    <TableCell>{season.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={season.status === "active" ? "text-primary border-primary bg-primary/10" : "text-amber-500 border-amber-500 bg-amber-500/10"}>
                        {season.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSeason(season.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {seasons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma temporada registrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
