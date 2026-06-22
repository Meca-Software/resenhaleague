"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Award,
  MapPin,
  Gamepad2,
  ShieldAlert,
  Flag,
  ChevronLeft,
  Flame,
  Star,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const getShadowColor = (colorClass: string) => {
  if (!colorClass) return "rgba(220, 38, 38, 0.8)"; // Vermelho padrão
  if (colorClass.includes("red") || colorClass.includes("#ff"))
    return "rgba(220, 38, 38, 0.8)";
  if (colorClass.includes("blue")) return "rgba(37, 99, 235, 0.8)";
  if (colorClass.includes("green")) return "rgba(22, 163, 74, 0.8)";
  if (colorClass.includes("yellow")) return "rgba(202, 138, 4, 0.8)";
  if (colorClass.includes("purple")) return "rgba(147, 51, 234, 0.8)";
  if (colorClass.includes("orange")) return "rgba(234, 88, 12, 0.8)";
  return "rgba(220, 38, 38, 0.8)"; // Vermelho padrão
};

export default function PublicPilotProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const [pilot, setPilot] = useState<any>(null);

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
        return <Trophy className={`w-4 h-4 ${c}`} />;
      case "star":
        return <Star className={`w-4 h-4 ${c}`} />;
      case "award":
        return <Award className={`w-4 h-4 ${c}`} />;
      case "shield":
        return <ShieldAlert className={`w-4 h-4 ${c}`} />;
      case "flame":
        return <Flame className={`w-4 h-4 ${c}`} />;
      case "zap":
        return <Zap className={`w-4 h-4 ${c}`} />;
      case "flag":
        return <Flag className={`w-4 h-4 ${c}`} />;
      default:
        return <Trophy className={`w-4 h-4 ${c}`} />;
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      // 1. Busca os dados do usuário do sistema pelo ID da conta
      const { data: systemUser, error: userError } = await supabase
        .from("system_users")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (!systemUser) {
        setIsLoading(false);
        return;
      }

      // 2. Busca se ele tem um piloto vinculado
      const { data: pilotData } = await supabase
        .from("pilots")
        .select("*, teams(name, color, logo_url)")
        .eq("profile_id", systemUser.id)
        .single();

      // 3. Busca resultados do piloto para calcular stats (se tiver piloto)
      let wins = 0,
        podiums = 0,
        points = 0;
      let recentRaces: any[] = [];
      let resultsCount = 0;
      let pinnedBadges: any[] = [];
      let allBadges: any[] = [];

      if (pilotData) {
        const { data: pbData } = await supabase
          .from("pilot_badges")
          .select("badges(*), is_pinned")
          .eq("pilot_id", pilotData.id);
        
        if (pbData) {
          allBadges = pbData.map((pb: any) => pb.badges).filter(Boolean);
          pinnedBadges = pbData.filter((pb: any) => pb.is_pinned).map((pb: any) => pb.badges).filter(Boolean);
        }
        const { data: results } = await supabase
          .from("race_results")
          .select("*, races(track_name, race_date)")
          .eq("pilot_id", pilotData.id);

        if (results && results.length > 0) {
          resultsCount = results.length;
          results.forEach((r) => {
            if (r.position === 1) wins++;
            if (r.position && r.position <= 3) podiums++;
            points += r.points || 0;
          });

          recentRaces = results
            .sort(
              (a, b) =>
                new Date(b.races?.race_date || 0).getTime() -
                new Date(a.races?.race_date || 0).getTime(),
            )
            .slice(0, 3)
            .map((r) => ({
              gp: r.races?.track_name || "Desconhecido",
              pos:
                r.status === "finished" ? r.position : r.status.toUpperCase(),
              date: new Date(
                r.races?.race_date || Date.now(),
              ).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }));
        }
      }

      // 4. Verifica se o usuário autenticado é dono do perfil
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id && session.user.id === systemUser.id) {
        setIsOwner(true);
      }

      // Monta os dados
      setPilot({
        id: systemUser.id,
        isPilot: !!pilotData,
        name: systemUser.full_name || systemUser.username,
        role: systemUser.role || "user",
        nationality: systemUser.nationality || pilotData?.nationality || "BR",
        number: pilotData?.number || null,
        team: pilotData?.teams || null,
        bio: systemUser.description || "Membro da comunidade Resenha League.",
        avatar_url: systemUser.avatar_url || pilotData?.avatar_url || null,
        banner_url: systemUser.banner_url || pilotData?.banner_url || null,
        stats: {
          races: resultsCount,
          wins,
          podiums,
          points,
          poles: 0,
        },
        recentRaces,
        pinnedBadges,
        allBadges,
      });

      setIsLoading(false);
    };

    loadProfile();
  }, [resolvedParams.id]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6)
      return toast.error("A senha deve ter no mínimo 6 caracteres.");
    setIsSavingPassword(true);

    try {
      const { forcePasswordChange } = await import("@/app/actions/auth-actions");
      const response = await forcePasswordChange(newPassword);
      
      setIsSavingPassword(false);
      
      if (!response.success) {
        toast.error("Erro ao alterar senha: " + response.error);
      } else {
        toast.success("Senha alterada com sucesso!");
        setNewPassword("");
      }
    } catch (err) {
      setIsSavingPassword(false);
      toast.error("Erro inesperado ao alterar senha.");
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-exo2">
        Usuário não encontrado no sistema.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 pt-6 pb-2 max-w-6xl">
        <Link
          href="/pilotos"
          className="inline-flex items-center text-sm font-exo2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Pilotos
        </Link>
      </div>

      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        {/* BANNER E HEADER */}
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl">
          <div
            className="h-48 md:h-64 w-full bg-linear-to-r from-neutral-900 via-primary/20 to-neutral-900 relative"
            style={
              pilot.banner_url
                ? {
                    backgroundImage: `url(${pilot.banner_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {}
            }
          >
            {!pilot.banner_url && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            )}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-background to-transparent"></div>
          </div>

          <div className="relative px-6 pb-8 md:px-12 flex flex-col md:flex-row gap-6 md:gap-10 -mt-20 md:-mt-24 items-center md:items-end">
            <div className="relative group z-10">
              <div
                className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition duration-500"
                style={{
                  boxShadow: `0 0 35px 5px ${getShadowColor(pilot.team?.color)}`,
                }}
              ></div>
              <Avatar className="w-32 h-32 md:w-48 md:h-48 border-4 border-background shadow-2xl relative bg-muted">
                <AvatarImage
                  src={pilot.avatar_url || ""}
                  alt={pilot.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-5xl font-rajdhani font-bold bg-muted text-muted-foreground">
                  {pilot.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3 z-10 mb-2 md:mb-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3 pt-1">
                <h1 className="text-2xl md:text-4xl font-orbitron font-bold tracking-tight flex items-center justify-center md:justify-start gap-3">
                  {pilot.name}
                  <img
                    src={`https://flagcdn.com/w40/${pilot.nationality.substring(0, 2).toLowerCase()}.png`}
                    alt={pilot.nationality}
                    className="w-8 h-6 md:w-10 md:h-7 object-cover rounded shadow-md opacity-90"
                  />
                </h1>

                {(pilot.role === "admin" || pilot.role === "superadmin") && (
                  <div className="flex items-center gap-1 bg-linear-to-r from-yellow-600/20 to-yellow-900/40 border border-yellow-500/50 rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)] mx-auto md:mx-0">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-orbitron font-bold text-yellow-500 text-xs tracking-widest uppercase">
                      Diretoria
                    </span>
                  </div>
                )}
                {pilot.role === "steward" && (
                  <div className="flex items-center gap-1 bg-linear-to-r from-blue-600/20 to-blue-900/40 border border-blue-500/50 rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)] mx-auto md:mx-0">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    <span className="font-orbitron font-bold text-blue-400 text-xs tracking-widest uppercase">
                      Comissário
                    </span>
                  </div>
                )}

              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-exo2">
                {pilot.pinnedBadges && pilot.pinnedBadges.filter((b: any) => b.name?.toLowerCase().includes('licença')).length > 0 ? (
                  pilot.pinnedBadges.filter((b: any) => b.name?.toLowerCase().includes('licença')).map((badge: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-background/50 border border-border/50 px-2 py-1 rounded shadow-sm"
                      title={badge.description}
                    >
                      {renderIcon(badge.icon_url, badge.rarity)}
                      <span className="font-rajdhani font-bold text-xs uppercase">
                        {badge.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-bold">
                      Licença Limpa
                    </span>
                  </span>
                )}
              </div>

              <p className="text-muted-foreground font-exo2 max-w-2xl leading-relaxed text-sm md:text-base pt-2">
                "{pilot.bio}"
              </p>
            </div>

            {pilot.isPilot && (pilot.number !== null || pilot.team) && (
              <div className="hidden lg:flex flex-row items-center justify-end gap-5 z-10 mb-2">
                {pilot.team && (
                  pilot.team.logo_url ? (
                    <img src={pilot.team.logo_url} alt={pilot.team.name} className="h-14 object-contain drop-shadow-lg" />
                  ) : (
                    <Badge className={`font-rajdhani uppercase tracking-wider text-white border-none ${pilot.team.color?.startsWith('#') ? '' : pilot.team.color}`} style={pilot.team.color?.startsWith('#') ? { backgroundColor: pilot.team.color } : {}}>
                      {pilot.team.name}
                    </Badge>
                  )
                )}
                {pilot.number !== null && (
                  <div className="bg-background/80 backdrop-blur border border-border/50 rounded-lg p-3 text-center min-w-[120px]">
                    <div className="text-xs font-rajdhani text-muted-foreground font-bold uppercase">
                      Número
                    </div>
                    <div className="text-3xl font-orbitron font-bold text-foreground">
                      #{pilot.number}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* ESTATÍSTICAS */}
            {pilot.isPilot && (
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="font-orbitron flex items-center gap-2">
                    <Flag className="w-5 h-5 text-primary" /> Histórico em
                    Corridas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-background/50 rounded-xl text-center border border-border/40 hover:border-primary/50 transition-colors">
                      <div className="text-3xl font-orbitron font-bold text-foreground">
                        {pilot.stats.races}
                      </div>
                      <div className="text-[10px] md:text-xs font-rajdhani text-muted-foreground font-bold uppercase mt-1">
                        Corridas
                      </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl text-center border border-border/40 hover:border-primary/50 transition-colors">
                      <div className="text-3xl font-orbitron font-bold text-primary">
                        {pilot.stats.wins}
                      </div>
                      <div className="text-[10px] md:text-xs font-rajdhani text-muted-foreground font-bold uppercase mt-1">
                        Vitórias
                      </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl text-center border border-border/40 hover:border-primary/50 transition-colors">
                      <div className="text-3xl font-orbitron font-bold text-foreground">
                        {pilot.stats.podiums}
                      </div>
                      <div className="text-[10px] md:text-xs font-rajdhani text-muted-foreground font-bold uppercase mt-1">
                        Pódios
                      </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl text-center border border-border/40 hover:border-primary/50 transition-colors">
                      <div className="text-3xl font-orbitron font-bold text-foreground">
                        {pilot.stats.poles}
                      </div>
                      <div className="text-[10px] md:text-xs font-rajdhani text-muted-foreground font-bold uppercase mt-1">
                        Poles
                      </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl text-center border border-border/40 hover:border-primary/50 transition-colors col-span-2 md:col-span-1">
                      <div className="text-3xl font-orbitron font-bold text-foreground">
                        {pilot.stats.points}
                      </div>
                      <div className="text-[10px] md:text-xs font-rajdhani text-muted-foreground font-bold uppercase mt-1">
                        Pontos
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VITRINE DE CONQUISTAS */}
            {pilot.allBadges && pilot.allBadges.length > 0 && (
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="font-orbitron flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-500" /> Vitrine de Conquistas
                  </CardTitle>
                  <div className="text-sm text-muted-foreground font-exo2 mt-0">
                    {pilot.allBadges.length} desbloqueada{pilot.allBadges.length !== 1 ? "s" : ""}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pilot.allBadges.map((badge: any, i: number) => {
                      const rarityColors = {
                        legendary: "from-yellow-500/20 to-yellow-900/40 border-yellow-500/30 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
                        epic: "from-purple-500/20 to-purple-900/40 border-purple-500/30 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
                        rare: "from-blue-500/20 to-blue-900/40 border-blue-500/30 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
                        common: "from-green-500/20 to-green-900/40 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      };
                      const rarityKey = (badge.rarity || 'common') as keyof typeof rarityColors;
                      const rarityColor = rarityColors[rarityKey] || rarityColors.common;

                      return (
                        <div key={i} className={`bg-linear-to-br ${rarityColor} border rounded-xl p-5 flex flex-col items-center text-center justify-center space-y-3 transition-transform hover:scale-105 duration-300`}>
                          <div className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center shadow-inner border border-border/50">
                            {renderIcon(badge.icon_url, badge.rarity)}
                          </div>
                          <div>
                            <div className="font-rajdhani font-bold text-base text-foreground mb-1">{badge.name}</div>
                            <div className="text-xs text-muted-foreground font-exo2 line-clamp-2">{badge.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* SEÇÃO DO PROPRIETÁRIO (ALTERAR SENHA) */}
            {isOwner && (
              <Card className="bg-card border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                <CardHeader>
                  <CardTitle className="font-orbitron flex items-center gap-2 text-xl">
                    <Lock className="w-5 h-5 text-primary" /> Segurança da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-exo2 text-muted-foreground">
                    Você está vendo o seu próprio perfil. Use a área abaixo caso
                    queira alterar a senha de acesso à Resenha League.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">
                        Nova Senha
                      </label>
                      <Input
                        type="password"
                        placeholder="Digite a nova senha (mín. 6 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || !newPassword}
                      className="font-bold"
                    >
                      {isSavingPassword ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        "Atualizar Senha"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            {pilot.isPilot && (
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="font-orbitron flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Atividade
                    Recente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pilot.recentRaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-exo2 text-center py-4">
                      Nenhuma corrida registrada.
                    </p>
                  ) : (
                    pilot.recentRaces.map((race: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h5 className="font-rajdhani font-bold text-sm">
                            {race.gp}
                          </h5>
                          <span className="text-xs text-muted-foreground font-exo2">
                            {race.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          {race.pos === 1 ? (
                            <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full font-orbitron font-bold text-sm border border-yellow-500/30">
                              1º
                            </div>
                          ) : typeof race.pos === "string" &&
                            race.pos !== "FINISHED" ? (
                            <div className="bg-destructive/20 text-destructive px-3 py-1 rounded-full font-orbitron font-bold text-sm border border-destructive/30">
                              {race.pos}
                            </div>
                          ) : (
                            <div className="bg-muted px-3 py-1 rounded-full font-orbitron font-bold text-sm border border-border/50">
                              {race.pos}º
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
