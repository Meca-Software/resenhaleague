"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Loader2, Send, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminHallDaFamaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("champion");
  const [pilotId, setPilotId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [seasonId, setSeasonId] = useState("");

  const fetchDados = async () => {
    setIsLoading(true);
    
    // Fetch Hall of Fame
    const { data: hData } = await supabase
      .from("hall_of_fame")
      .select("*, pilots(name), teams(name), seasons(name)")
      .order("created_at", { ascending: false });
    if (hData) setHallOfFame(hData);

    // Fetch Pilots
    const { data: pData } = await supabase
      .from("pilots")
      .select("id, name")
      .order("name", { ascending: true });
    if (pData) setPilots(pData);

    // Fetch Teams
    const { data: tData } = await supabase
      .from("teams")
      .select("id, name")
      .order("name", { ascending: true });
    if (tData) setTeams(tData);

    // Fetch Seasons
    const { data: sData } = await supabase
      .from("seasons")
      .select("id, name, championships(name)")
      .order("created_at", { ascending: false });
    if (sData) setSeasons(sData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleAddToHall = async () => {
    if (!title || !description) return toast.error("Preencha o título e a descrição.");
    if ((!pilotId || pilotId === "none") && (!teamId || teamId === "none")) return toast.error("Selecione um piloto ou equipe.");

    setIsSubmitting(true);
    const { error } = await supabase.from("hall_of_fame").insert({
      title,
      description,
      type,
      pilot_id: pilotId === "none" ? null : pilotId || null,
      team_id: teamId === "none" ? null : teamId || null,
      season_id: seasonId === "none" ? null : seasonId || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
    } else {
      toast.success("Adicionado ao Hall da Fama com sucesso!");
      setTitle("");
      setDescription("");
      setType("champion");
      setPilotId("");
      setTeamId("");
      setSeasonId("");
      fetchDados();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este registro do Hall da Fama?")) return;

    const { error } = await supabase.from("hall_of_fame").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      toast.success("Removido com sucesso!");
      fetchDados();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
          <Crown className="w-8 h-8 text-amber-500" /> GERENCIAR HALL DA FAMA
        </h1>
        <p className="text-muted-foreground font-exo2 mt-1">
          Adicione lendas, campeões e recordes ao mural histórico da liga.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULÁRIO */}
        <div className="lg:col-span-1">
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg sticky top-8">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl">Nova Lenda</CardTitle>
              <CardDescription className="font-exo2">
                Preencha os dados da conquista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campeão F1 T10"
                  className="font-exo2 bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Dominou a temporada de 2024"
                  className="font-exo2 bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Tipo (Ícone)</Label>
                <Select value={type} onValueChange={(val) => val && setType(val)}>
                  <SelectTrigger className="font-exo2 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="champion">Campeão (Coroa)</SelectItem>
                    <SelectItem value="record">Recorde (Estrela)</SelectItem>
                    <SelectItem value="award">Prêmio/Lenda (Medalha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Piloto (Opcional)</Label>
                <Select value={pilotId} onValueChange={(val) => val && setPilotId(val)}>
                  <SelectTrigger className="font-exo2 bg-background/50 border-border/50">
                    <span className="flex-1 text-left text-sm truncate">
                      {pilotId && pilotId !== "none" ? pilots.find(p => p.id === pilotId)?.name : <span className="text-muted-foreground">Nenhum piloto</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum piloto</SelectItem>
                    {pilots.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Equipe (Opcional)</Label>
                <Select value={teamId} onValueChange={(val) => val && setTeamId(val)}>
                  <SelectTrigger className="font-exo2 bg-background/50 border-border/50">
                    <span className="flex-1 text-left text-sm truncate">
                      {teamId && teamId !== "none" ? teams.find(t => t.id === teamId)?.name : <span className="text-muted-foreground">Nenhuma equipe</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma equipe</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-rajdhani font-bold text-xs uppercase">Temporada (Opcional)</Label>
                <Select value={seasonId} onValueChange={(val) => val && setSeasonId(val)}>
                  <SelectTrigger className="font-exo2 bg-background/50 border-border/50">
                    <span className="flex-1 text-left text-sm truncate">
                      {seasonId && seasonId !== "none" ? (() => {
                        const s = seasons.find(s => s.id === seasonId);
                        return s ? `${s.championships?.name} - ${s.name}` : null;
                      })() : <span className="text-muted-foreground">Nenhuma temporada</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma temporada</SelectItem>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.championships?.name} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddToHall}
                disabled={isSubmitting}
                className="w-full mt-4 font-rajdhani font-bold tracking-widest shadow-lg shadow-primary/20 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                ADICIONAR AO HALL
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* LISTA */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hallOfFame.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-exo2 border border-dashed border-border/50 rounded-lg bg-card/20">
              Nenhuma lenda registrada no Hall da Fama.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hallOfFame.map((item) => (
                <Card key={item.id} className="bg-card/40 border-border/50 flex justify-between items-center pr-4 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-3 mb-1">
                      {item.type === "champion" && <Crown className="w-5 h-5 text-amber-500" />}
                      {item.type === "record" && <Crown className="w-5 h-5 text-amber-700" />}
                      {item.type === "award" && <Crown className="w-5 h-5 text-gray-400" />}
                      <span className="font-rajdhani text-xs font-bold uppercase text-muted-foreground tracking-widest">
                        {item.type === "champion" ? "Campeão" : item.type === "record" ? "Recorde" : "Prêmio"}
                      </span>
                    </div>
                    <CardTitle className="font-orbitron text-lg">{item.title}</CardTitle>
                    <CardDescription className="font-exo2 text-sm max-w-lg">
                      {item.description}
                    </CardDescription>
                    <div className="mt-2 text-xs font-rajdhani font-bold flex flex-wrap gap-2">
                      {item.pilots && <span className="bg-primary/10 text-primary px-2 py-1 rounded">Piloto: {item.pilots.name}</span>}
                      {item.teams && <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded">Equipe: {item.teams.name}</span>}
                      {item.seasons && <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded">Temp: {item.seasons.name}</span>}
                    </div>
                  </CardHeader>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-white hover:bg-destructive shrink-0"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
