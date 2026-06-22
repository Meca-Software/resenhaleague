"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Trophy,
  Flag,
  Timer,
  ChevronRight,
  Users,
  Car,
  Medal,
  Tv,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import heroImage from "@/img/some-epic-f126-photos-v0-wdr3t5uo096h1.jpg";
import Image from "next/image";

export default function Home() {
  const [nextRace, setNextRace] = useState<any>(null);
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
  });
  const [newsList, setNewsList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pilots: 0,
    teams: 0,
    races: 0,
    winners: 0,
  });
  const [highlights, setHighlights] = useState({
    topPilot: { name: "Aguardando", points: 0, team: "" },
    topTeam: { name: "Aguardando", points: 0 },
    lastWinner: { name: "Aguardando", race: "", points: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isPilot, setIsPilot] = useState(false);
  const [pilotSeasonId, setPilotSeasonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      let pSeasonId = null;
      // Check auth user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsUserLogged(true);
        // check if is pilot
        const { data: pilotsData } = await supabase.from('pilots').select('id, season_id').eq('profile_id', user.id).limit(1);
        if (pilotsData && pilotsData.length > 0) {
          setIsPilot(true);
          pSeasonId = pilotsData[0].season_id;
          setPilotSeasonId(pSeasonId);
        }
      }

      // 1. Next Race
      let racesQuery = supabase
        .from("races")
        .select("*")
        .eq("status", "upcoming")
        .order("race_date", { ascending: true })
        .limit(1);
        
      if (pSeasonId) {
        racesQuery = racesQuery.eq('season_id', pSeasonId);
      }
      
      const { data: racesData } = await racesQuery;

      if (racesData && racesData.length > 0) {
        setNextRace(racesData[0]);
      }

      // 2. News
      const { data: newsData } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (newsData) {
        setNewsList(newsData);
      }

      // 3. Stats
      const { count: pilotsCount } = await supabase
        .from("pilots")
        .select("*", { count: "exact", head: true });
      const { count: teamsCount } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true });
      const { count: racesCount } = await supabase
        .from("races")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      const { data: resultsData } = await supabase
        .from("race_results")
        .select("pilot_id")
        .eq("position", 1);
      const uniqueWinners = new Set(resultsData?.map((r) => r.pilot_id)).size;

      setStats({
        pilots: pilotsCount || 0,
        teams: teamsCount || 0,
        races: racesCount || 0,
        winners: uniqueWinners,
      });

      // 4. Highlights (Top Pilot, Top Team, Last Winner)
      const { data: topPilots } = await supabase
        .from("pilots")
        .select("*, teams(name), system_users(full_name, username)")
        .order("stats->points", { ascending: false })
        .limit(1);

      let topTeamObj = { name: "Aguardando", points: 0 };
      const { data: allPilots } = await supabase
        .from("pilots")
        .select("*, teams(id, name)");
      if (allPilots) {
        const teamPoints: Record<string, { name: string; points: number }> = {};
        allPilots.forEach((p) => {
          if (p.teams) {
            if (!teamPoints[p.teams.id])
              teamPoints[p.teams.id] = { name: p.teams.name, points: 0 };
            teamPoints[p.teams.id].points += p.stats?.points || 0;
          }
        });
        const sortedTeams = Object.values(teamPoints).sort(
          (a, b) => b.points - a.points,
        );
        if (sortedTeams.length > 0) topTeamObj = sortedTeams[0];
      }

      let lastWinnerObj = { name: "Aguardando", race: "", points: 0 };
      const { data: lastRaceResult } = await supabase
        .from("race_results")
        .select("*, pilots(name, system_users(full_name, username)), races(name)")
        .eq("position", 1)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastRaceResult && lastRaceResult.length > 0) {
        lastWinnerObj = {
          name: lastRaceResult[0].pilots?.system_users?.full_name || lastRaceResult[0].pilots?.system_users?.username || lastRaceResult[0].pilots?.name || "Desconhecido",
          race: lastRaceResult[0].races?.name || "Corrida",
          points: lastRaceResult[0].points || 25,
        };
      }

      setHighlights({
        topPilot:
          topPilots && topPilots.length > 0
            ? {
                name: topPilots[0].system_users?.full_name || topPilots[0].system_users?.username || topPilots[0].name,
                points: topPilots[0].stats?.points || 0,
                team: topPilots[0].teams?.name || "Sem Equipe",
              }
            : { name: "Aguardando", points: 0, team: "" },
        topTeam: topTeamObj,
        lastWinner: lastWinnerObj,
      });

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Timer logic for Next Race
  useEffect(() => {
    if (!nextRace || !nextRace.race_date) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const raceTime = new Date(nextRace.race_date).getTime();
      const distance = raceTime - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: "00", hours: "00", minutes: "00" });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown({
        days: days.toString().padStart(2, "0"),
        hours: hours.toString().padStart(2, "0"),
        minutes: minutes.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRace]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative w-full py-20 md:py-32 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-background/90 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center grayscale opacity-30"
          style={{ backgroundImage: `url(${heroImage.src})` }}
        />

        <div className="container mx-auto max-w-7xl relative z-20 flex flex-col items-center text-center space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter font-orbitron drop-shadow-lg">
              A <span className="text-primary">VELOCIDADE</span> EM
              <br />
              SUA FORMA MAIS RESENHUDA
            </h1>
            <p className="mt-4 text-xl text-muted-foreground font-exo2 max-w-2xl mx-auto">
              Bem-vindo à Resenha League. A liga virtual feita para quem gosta
              de correr, competir e se divertir. Competição, profissionalismo e
              resenha.
            </p>
          </motion.div>

          {/* Próxima Corrida */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-3xl bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 min-h-[140px]"
          >
            {isLoading ? (
              <div className="w-full text-center text-muted-foreground font-exo2">
                Carregando dados da liga...
              </div>
            ) : nextRace ? (
              <>
                <div className="flex flex-col items-center md:items-start text-left">
                  <span className="text-primary font-rajdhani font-bold tracking-widest uppercase text-sm mb-1">
                    Próxima Etapa
                  </span>
                  <h2 className="text-2xl font-bold font-orbitron">
                    {nextRace.name.toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2 font-exo2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(nextRace.race_date).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      BRT
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-orbitron font-bold">
                      {countdown.days}
                    </span>
                    <span className="text-xs text-muted-foreground font-exo2 uppercase">
                      Dias
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-orbitron font-bold text-primary">
                      :
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-orbitron font-bold">
                      {countdown.hours}
                    </span>
                    <span className="text-xs text-muted-foreground font-exo2 uppercase">
                      Horas
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-orbitron font-bold text-primary">
                      :
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-orbitron font-bold">
                      {countdown.minutes}
                    </span>
                    <span className="text-xs text-muted-foreground font-exo2 uppercase">
                      Min
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-muted-foreground font-exo2">
                Nenhuma corrida programada.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {isUserLogged && isPilot && nextRace && (
              <Link href="/portal/proxima-corrida">
                <Button
                  size="lg"
                  className="font-rajdhani text-lg font-bold tracking-wider w-full sm:w-auto h-12 px-8 bg-green-600 hover:bg-green-700 text-white"
                >
                  CONFIRMAR PRESENÇA
                </Button>
              </Link>
            )}
            <Link href="/campeonatos">
              <Button
                size="lg"
                className="font-rajdhani text-lg font-bold tracking-wider w-full sm:w-auto h-12 px-8"
              >
                VER CAMPEONATO
              </Button>
            </Link>
            <Link href="/classificacoes">
              <Button
                variant="outline"
                size="lg"
                className="font-rajdhani text-lg font-bold tracking-wider w-full sm:w-auto h-12 px-8 border-border hover:bg-white/5"
              >
                VER CLASSIFICAÇÃO
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CARDS DE DESTAQUE */}
      <section className="py-20 bg-secondary/30 relative">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold font-orbitron flex items-center gap-3">
              <Trophy className="text-primary w-8 h-8" /> DESTAQUES DA TEMPORADA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription className="font-rajdhani uppercase tracking-widest text-primary flex items-center gap-2">
                  <Medal className="w-4 h-4" /> Líder do Campeonato
                </CardDescription>
                <CardTitle className="font-orbitron text-2xl truncate">
                  {highlights.topPilot.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <span className="text-muted-foreground font-exo2 text-sm truncate">
                    {highlights.topPilot.team}
                  </span>
                  <span className="font-rajdhani font-bold text-2xl whitespace-nowrap">
                    {highlights.topPilot.points} PTS
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription className="font-rajdhani uppercase tracking-widest text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" /> Construtores
                </CardDescription>
                <CardTitle className="font-orbitron text-2xl truncate">
                  {highlights.topTeam.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <span className="text-muted-foreground font-exo2 text-sm">
                    Líderes
                  </span>
                  <span className="font-rajdhani font-bold text-2xl whitespace-nowrap">
                    {highlights.topTeam.points} PTS
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription className="font-rajdhani uppercase tracking-widest text-primary flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Último Vencedor
                </CardDescription>
                <CardTitle className="font-orbitron text-2xl truncate">
                  {highlights.lastWinner.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <span className="text-muted-foreground font-exo2 text-sm truncate max-w-[120px]">
                    {highlights.lastWinner.race}
                  </span>
                  <span className="font-rajdhani font-bold text-xl text-green-500 flex items-center whitespace-nowrap">
                    +{highlights.lastWinner.points}{" "}
                    <Trophy className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription className="font-rajdhani uppercase tracking-widest text-primary flex items-center gap-2">
                  <Tv className="w-4 h-4" /> Transmissão Ao Vivo
                </CardDescription>
                <CardTitle className="font-orbitron text-xl truncate">
                  {nextRace ? nextRace.name : "Aguardando"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <span className="text-muted-foreground font-exo2 text-sm">
                    YouTube & Twitch
                  </span>
                  <Link
                    href="#"
                    className="font-rajdhani font-bold text-sm text-primary hover:underline flex items-center whitespace-nowrap"
                  >
                    Assistir <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ESTATÍSTICAS RÁPIDAS */}
      <section className="py-20 border-y border-border/40 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-32 bg-primary blur-[120px] opacity-10 rounded-full" />
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-orbitron font-bold text-primary">
                {stats.pilots < 10 ? `0${stats.pilots}` : stats.pilots}
              </h4>
              <p className="font-rajdhani text-muted-foreground uppercase tracking-widest text-sm font-semibold">
                Pilotos Ativos
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-orbitron font-bold text-primary">
                {stats.teams < 10 ? `0${stats.teams}` : stats.teams}
              </h4>
              <p className="font-rajdhani text-muted-foreground uppercase tracking-widest text-sm font-semibold">
                Equipes
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-orbitron font-bold text-primary">
                {stats.races < 10 ? `0${stats.races}` : stats.races}
              </h4>
              <p className="font-rajdhani text-muted-foreground uppercase tracking-widest text-sm font-semibold">
                Corridas Realizadas
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-orbitron font-bold text-primary">
                {stats.winners < 10 ? `0${stats.winners}` : stats.winners}
              </h4>
              <p className="font-rajdhani text-muted-foreground uppercase tracking-widest text-sm font-semibold">
                Vencedores Diferentes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NOTÍCIAS */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold font-orbitron">
              ÚLTIMAS NOTÍCIAS
            </h2>
            <Link href="/noticias">
              <Button variant="ghost" className="font-rajdhani group">
                Ver Todas{" "}
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {newsList.length === 0 ? (
            <div className="text-center text-muted-foreground font-exo2 py-10">
              Nenhuma notícia publicada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newsList.map((news) => (
                <Link href={`/noticias/${news.slug}`} key={news.id}>
                  <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors overflow-hidden group cursor-pointer h-full flex flex-col">
                    <div className="h-48 bg-muted relative overflow-hidden shrink-0">
                      {news.cover_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                          style={{ backgroundImage: `url(${news.cover_url})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                      )}
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-primary text-primary-foreground text-xs font-bold font-rajdhani px-2 py-1 uppercase rounded shadow">
                          {news.category || "Geral"}
                        </span>
                      </div>
                    </div>
                    <CardContent className="pt-6 flex-1 flex flex-col">
                      <div className="text-xs text-muted-foreground font-exo2 mb-2 flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {news.published_at
                          ? new Date(news.published_at).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short" },
                            )
                          : new Date(news.created_at).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short" },
                            )}
                      </div>
                      <h3 className="font-orbitron font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {news.title}
                      </h3>
                      {news.content && (
                        <p className="text-sm text-muted-foreground font-exo2 line-clamp-2 mt-auto">
                          {news.content.substring(0, 100)}...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
