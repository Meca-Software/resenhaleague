"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Star,
  Award,
  ShieldAlert,
  Flame,
  Zap,
  Flag,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminConquistasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);

  // Form: Create Badge
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRarity, setNewRarity] = useState("common");
  const [newIcon, setNewIcon] = useState("trophy");

  // Form: Assign Badge
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");

  const fetchDados = async () => {
    setIsLoading(true);
    // Fetch all badges
    const { data: bData } = await supabase
      .from("badges")
      .select("*")
      .order("created_at", { ascending: false });
    if (bData) setBadges(bData);

    // Fetch all pilots
    const { data: pData } = await supabase
      .from("pilots")
      .select("id, name, teams(name)")
      .order("name", { ascending: true });
    if (pData) setPilots(pData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleCreateBadge = async () => {
    if (!newName || !newDesc) return toast.error("Preencha o nome e a descrição.");

    setIsSubmitting(true);
    const { error } = await supabase.from("badges").insert({
      name: newName,
      description: newDesc,
      rarity: newRarity,
      icon_url: newIcon,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao criar conquista: " + error.message);
    } else {
      toast.success("Conquista criada com sucesso!");
      setNewName("");
      setNewDesc("");
      setNewRarity("common");
      setNewIcon("trophy");
      fetchDados();
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedPilotId || !selectedBadgeId)
      return toast.error("Selecione um piloto e uma conquista.");

    setIsSubmitting(true);
    const { error } = await supabase.from("pilot_badges").insert({
      pilot_id: selectedPilotId,
      badge_id: selectedBadgeId,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.success("Este piloto já possui essa conquista!");
      } else {
        toast.error("Erro ao entregar conquista: " + error.message);
      }
    } else {
      toast.success("Conquista entregue com sucesso!");
      setSelectedPilotId("");
      setSelectedBadgeId("");
    }
  };

  const renderIcon = (iconName: string, rarity: string) => {
    const getColors = () => {
      switch (rarity) {
        case "legendary":
          return "text-yellow-500";
        case "epic":
          return "text-purple-500";
        case "rare":
          return "text-blue-500";
        default:
          return "text-green-500";
      }
    };
    const c = getColors();
    switch (iconName) {
      case "trophy":
        return <Trophy className={`w-8 h-8 ${c}`} />;
      case "star":
        return <Star className={`w-8 h-8 ${c}`} />;
      case "award":
        return <Award className={`w-8 h-8 ${c}`} />;
      case "shield":
        return <ShieldAlert className={`w-8 h-8 ${c}`} />;
      case "flame":
        return <Flame className={`w-8 h-8 ${c}`} />;
      case "zap":
        return <Zap className={`w-8 h-8 ${c}`} />;
      case "flag":
        return <Flag className={`w-8 h-8 ${c}`} />;
      default:
        return <Trophy className={`w-8 h-8 ${c}`} />;
    }
  };

  const getRarityText = (type: string) => {
    switch (type) {
      case "legendary":
        return "Lendário";
      case "epic":
        return "Épico";
      case "rare":
        return "Raro";
      default:
        return "Comum";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
          <Award className="w-8 h-8 text-primary" /> GERENCIAR CONQUISTAS
        </h1>
        <p className="text-muted-foreground font-exo2 mt-1">
          Crie novas conquistas para o sistema ou entregue-as diretamente aos
          pilotos.
        </p>
      </div>

      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-background/50 border border-border/50">
          <TabsTrigger
            value="assign"
            className="font-rajdhani font-bold tracking-wider"
          >
            Entregar Conquista
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="font-rajdhani font-bold tracking-wider"
          >
            Criar Nova
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl">
                Entregar Conquista a um Piloto
              </CardTitle>
              <CardDescription className="font-exo2">
                Escolha o piloto merecedor e a conquista que ele deve receber.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                      Piloto
                    </Label>
                    <Select
                      value={selectedPilotId}
                      onValueChange={(val) => val && setSelectedPilotId(val)}
                    >
                      <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11">
                        <span className="flex-1 text-left text-sm truncate">
                          {selectedPilotId ? (() => {
                            const p = pilots.find(p => p.id === selectedPilotId);
                            return p ? `${p.name} ${p.teams?.name ? `(${p.teams.name})` : ""}` : null;
                          })() : <span className="text-muted-foreground">Selecione o piloto...</span>}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {pilots.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.teams?.name ? `(${p.teams.name})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                      Conquista (Badge)
                    </Label>
                    <Select
                      value={selectedBadgeId}
                      onValueChange={(val) => val && setSelectedBadgeId(val)}
                    >
                      <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11">
                        <span className="flex-1 text-left text-sm truncate">
                          {selectedBadgeId ? (() => {
                            const b = badges.find(b => b.id === selectedBadgeId);
                            return b ? `[${getRarityText(b.rarity)}] ${b.name}` : null;
                          })() : <span className="text-muted-foreground">Selecione a conquista...</span>}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {badges.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            [{getRarityText(b.rarity)}] {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Button
                onClick={handleAssignBadge}
                disabled={isSubmitting || isLoading}
                className="w-full md:w-auto font-rajdhani font-bold tracking-widest shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                ENTREGAR CONQUISTA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl">
                Criar Nova Conquista Global
              </CardTitle>
              <CardDescription className="font-exo2">
                Adicione uma nova conquista ao catálogo da liga para ser
                desbloqueada depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                    Nome da Conquista
                  </Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Campeão T10"
                    className="font-exo2 bg-background/50 border-border/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                    Raridade
                  </Label>
                  <Select
                    value={newRarity}
                    onValueChange={(val) => val && setNewRarity(val)}
                  >
                    <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Comum</SelectItem>
                      <SelectItem value="rare">Raro</SelectItem>
                      <SelectItem value="epic">Épico</SelectItem>
                      <SelectItem value="legendary">Lendário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                    Ícone Visual
                  </Label>
                  <Select
                    value={newIcon}
                    onValueChange={(val) => val && setNewIcon(val)}
                  >
                    <SelectTrigger className="font-exo2 bg-background/50 border-border/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trophy">Troféu</SelectItem>
                      <SelectItem value="star">Estrela</SelectItem>
                      <SelectItem value="award">Medalha</SelectItem>
                      <SelectItem value="shield">
                        Escudo (Piloto Limpo)
                      </SelectItem>
                      <SelectItem value="flame">Chama (On Fire)</SelectItem>
                      <SelectItem value="zap">Raio (Volta Rápida)</SelectItem>
                      <SelectItem value="flag">
                        Bandeira Quadriculada (Pole/Vitória)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-rajdhani font-bold text-sm uppercase tracking-wider">
                    Descrição Curta
                  </Label>
                  <Input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ex: Venceu o campeonato mundial da T10"
                    className="font-exo2 bg-background/50 border-border/50 h-11"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/20 border border-border/50 rounded-lg flex items-center gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-background to-muted rounded-full flex items-center justify-center border-2 border-border shadow-xl">
                  {renderIcon(newIcon, newRarity)}
                </div>
                <div>
                  <h4 className="font-rajdhani font-bold text-lg">
                    {newName || "Nome da Conquista"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-exo2">
                    {newDesc || "Descrição curta do que o piloto fez..."}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCreateBadge}
                disabled={isSubmitting}
                className="font-rajdhani font-bold tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                CADASTRAR CONQUISTA NO SISTEMA
              </Button>
            </CardContent>
          </Card>

          {/* List existing badges */}
          <h3 className="font-orbitron font-bold text-lg mt-8 mb-4">
            Catálogo Atual
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-border/40 bg-background/30 opacity-80"
              >
                <div className="w-12 h-12 bg-linear-to-br from-background to-muted rounded-full flex items-center justify-center border-2 border-border mb-3">
                  {renderIcon(b.icon_url, b.rarity)}
                </div>
                <h4 className="font-rajdhani font-bold text-sm">{b.name}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {getRarityText(b.rarity)}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
