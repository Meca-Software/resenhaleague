"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const F1_LOGOS = [
  "alpine.png",
  "aston_martin.png",
  "audi.png",
  "cadillac.png",
  "ferrari.png",
  "haas.png",
  "mclaren.png",
  "mercedes.png",
  "racing_bulls.png",
  "red_bull.png",
  "williams.svg",
];

export default function AdminPilotosPage() {
  const [pilots, setPilots] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Para linkar o piloto a um login
  const [seasons, setSeasons] = useState<any[]>([]); // Temporadas
  const [isLoading, setIsLoading] = useState(true);

  // States de Formulários
  const [isCreatingPilot, setIsCreatingPilot] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null);

  const supabase = createClient();

  // Form Team
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState("");

  // Form Pilot
  const [pilotNumber, setPilotNumber] = useState("");
  const [pilotTeam, setPilotTeam] = useState("");
  const [pilotProfile, setPilotProfile] = useState(""); // system_users id
  const [pilotSeason, setPilotSeason] = useState(""); // season_id

  const fetchData = async () => {
    setIsLoading(true);
    // Busca Pilotos com a relação da Equipe
    const { data: pilotsData } = await supabase
      .from("pilots")
      .select(`*, teams(name, color, logo_url)`);

    // Busca Equipes
    const { data: teamsData } = await supabase.from("teams").select("*");

    // Busca Usuários que são da role 'pilot' para vincular
    const { data: usersData } = await supabase
      .from("system_users")
      .select("*")
      .eq("role", "pilot");

    // Busca Temporadas
    const { data: seasonsData } = await supabase
      .from("seasons")
      .select("id, name, championships(name)");

    if (pilotsData) setPilots(pilotsData);
    if (teamsData) setTeams(teamsData);
    if (usersData) setUsers(usersData);
    if (seasonsData) setSeasons(seasonsData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTeam = async () => {
    if (!teamName) return toast.error("Preencha o nome da equipe");
    const payload: any = { name: teamName };
    if (teamLogo) payload.logo_url = `/f1_logos/${teamLogo}`;
    else payload.logo_url = null;

    if (editingTeamId) {
      const { error } = await supabase.from("teams").update(payload).eq("id", editingTeamId);
      if (error) return toast.error(error.message);
      toast.success("Equipe atualizada!");
    } else {
      const { error } = await supabase.from("teams").insert([payload]);
      if (error) return toast.error(error.message);
      toast.success("Equipe criada!");
    }

    setTeamName("");
    setTeamLogo("");
    setEditingTeamId(null);
    setIsCreatingTeam(false);
    fetchData();
  };

  const handleEditTeam = (team: any) => {
    setTeamName(team.name);
    if (team.logo_url) {
      setTeamLogo(team.logo_url.replace("/f1_logos/", ""));
    } else {
      setTeamLogo("");
    }
    setEditingTeamId(team.id);
    setIsCreatingTeam(true);
    setIsCreatingPilot(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSavePilot = async () => {
    if (!pilotNumber || !pilotSeason || !pilotProfile)
      return alert(
        "Preencha os campos obrigatórios (Número, Temporada e Vincular Conta)",
      );

    const selectedUser = users.find((u) => u.id === pilotProfile);
    const generatedName = selectedUser ? selectedUser.username : `Piloto #${pilotNumber}`;

    const payload: any = {
      name: generatedName,
      number: parseInt(pilotNumber),
      season_id: pilotSeason,
      current_team_id: pilotTeam || null,
      profile_id: pilotProfile,
    };

    if (editingPilotId) {
      const { error } = await supabase.from("pilots").update(payload).eq("id", editingPilotId);
      if (error) return toast.error(error.message);
      toast.success("Piloto atualizado!");
    } else {
      const { error } = await supabase.from("pilots").insert([payload]);
      if (error) return toast.error(error.message);
      toast.success("Piloto criado!");
    }

    setPilotNumber("");
    setPilotTeam("");
    setPilotSeason("");
    setPilotProfile("");
    setEditingPilotId(null);
    setIsCreatingPilot(false);
    fetchData();
  };

  const handleEditPilot = (pilot: any) => {
    setPilotNumber(pilot.number.toString());
    setPilotTeam(pilot.current_team_id || "");
    setPilotSeason(pilot.season_id || "");
    setPilotProfile(pilot.profile_id || "");
    setEditingPilotId(pilot.id);
    setIsCreatingPilot(true);
    setIsCreatingTeam(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePilot = async (id: string) => {
    if (confirm("Apagar este piloto?")) {
      await supabase.from("pilots").delete().eq("id", id);
      fetchData();
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (
      confirm(
        "Apagar esta equipe? Atenção: isso pode afetar os pilotos que já estão vinculados a ela.",
      )
    ) {
      await supabase.from("teams").delete().eq("id", id);
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> PILOTOS E EQUIPES
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Gerencie o grid oficial, contratos e equipes ativas no Supabase.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="font-rajdhani font-bold"
            onClick={() => {
              setIsCreatingTeam(!isCreatingTeam);
              if (isCreatingTeam) setEditingTeamId(null);
              setIsCreatingPilot(false);
            }}
          >
            + NOVA EQUIPE
          </Button>
          <Button
            className="font-rajdhani font-bold"
            onClick={() => {
              setIsCreatingPilot(!isCreatingPilot);
              if (isCreatingPilot) setEditingPilotId(null);
              setIsCreatingTeam(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> NOVO PILOTO
          </Button>
        </div>
      </div>

      {isCreatingTeam && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">
              {editingTeamId ? "Editar Equipe" : "Cadastrar Nova Equipe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 font-exo2">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">
                  Nome da Equipe
                </label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Scuderia Ferrari"
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">
                  Ícone da Equipe
                </label>
                <select
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Sem ícone</option>
                  {F1_LOGOS.map((logo) => (
                    <option key={logo} value={logo}>
                      {logo
                        .replace(".png", "")
                        .replace(".svg", "")
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setIsCreatingTeam(false); setEditingTeamId(null); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTeam}
                className="bg-green-600 hover:bg-green-700 font-bold"
              >
                {editingTeamId ? "Salvar Alterações" : "Salvar Equipe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCreatingPilot && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">
              {editingPilotId ? "Editar Piloto" : "Cadastrar Novo Piloto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 font-exo2">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">
                  Número do Carro
                </label>
                <Input
                  type="number"
                  value={pilotNumber}
                  onChange={(e) => setPilotNumber(e.target.value)}
                  placeholder="Ex: 16"
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-primary">
                  Vincular Conta (Obrigatório)
                </label>
                <select
                  value={pilotProfile}
                  onChange={(e) => setPilotProfile(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="">Selecione uma conta...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">
                  Equipe
                </label>
                <select
                  value={pilotTeam}
                  onChange={(e) => setPilotTeam(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Sem equipe</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-primary">
                  Temporada (Obrigatório)
                </label>
                <select
                  value={pilotSeason}
                  onChange={(e) => setPilotSeason(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="">Selecione uma temporada...</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.championships?.name} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setIsCreatingPilot(false); setEditingPilotId(null); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSavePilot}
                className="bg-green-600 hover:bg-green-700 font-bold"
              >
                {editingPilotId ? "Salvar Alterações" : "Salvar Piloto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">
            Equipes Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando equipes...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border/50 text-center gap-2 relative group"
                >
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTeam(team)}
                      className="text-blue-400 hover:text-blue-300 w-6 h-6"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-destructive hover:text-destructive w-6 h-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-16 h-16 object-contain"
                    />
                  ) : team.color ? (
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{ backgroundColor: team.color }}
                    ></div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted"></div>
                  )}
                  <span className="font-exo2 font-bold text-sm mt-2">
                    {team.name}
                  </span>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full text-center py-4 text-muted-foreground">
                  Nenhuma equipe encontrada.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">
            Pilotos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">
              Carregando pilotos do banco de dados...
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>NOME</TableHead>
                  <TableHead>EQUIPE</TableHead>
                  <TableHead className="text-center">Nº</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {pilots.map((pilot) => (
                  <TableRow key={pilot.id}>
                    <TableCell className="font-bold">{pilot.name}</TableCell>
                    <TableCell>
                      {pilot.teams ? (
                        <div className="flex items-center gap-2">
                          {pilot.teams.logo_url ? (
                            <img
                              src={pilot.teams.logo_url}
                              alt={pilot.teams.name}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: pilot.teams.color || "#ccc",
                              }}
                            ></span>
                          )}
                          {pilot.teams.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Agente Livre
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-orbitron font-bold text-lg">
                      {pilot.number}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPilot(pilot)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePilot(pilot.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pilots.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum piloto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
