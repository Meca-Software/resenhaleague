"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CalendarioPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRaces = async () => {
      const { data, error } = await supabase
        .from('races')
        .select('*, seasons(name, championships(name))')
        .order('race_date', { ascending: true });
      
      if (data) setRaces(data);
      setIsLoading(false);
    };

    fetchRaces();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight">CALENDÁRIO</h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Acompanhe as datas, circuitos e resultados de cada etapa.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Carregando calendário...</p></div>
      ) : races.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Nenhuma corrida encontrada no calendário.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map((race) => {
            const isNext = race.status === 'upcoming'; // Logica simples para "Próxima"
            const raceDate = new Date(race.race_date);

            return (
              <Card 
                key={race.id} 
                className={`overflow-hidden transition-all hover:border-primary/50 flex flex-col ${
                  isNext ? "border-primary shadow-[0_0_20px_rgba(225,6,0,0.15)] ring-1 ring-primary/50 relative" : "bg-card/50"
                }`}
              >
                {isNext && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold font-rajdhani px-3 py-1 rounded-bl-lg z-10">
                    PRÓXIMA ETAPA
                  </div>
                )}
                
                <div className="h-32 bg-muted relative flex items-center justify-center overflow-hidden border-b border-border/50">
                  <div className="absolute inset-0 bg-linear-to-t from-background/90 to-transparent z-10" />
                  <div className="text-8xl opacity-10 absolute -right-4 -bottom-4 rotate-12">🏁</div>
                  <div className="z-20 text-center flex items-center justify-center h-full">
                    {race.country_code ? (
                      <img src={`https://flagcdn.com/w80/${race.country_code.toLowerCase()}.png`} alt={race.country_code} className="h-14 w-auto rounded-md shadow-lg drop-shadow-md" />
                    ) : (
                      <span className="text-4xl drop-shadow-md">🏎️</span>
                    )}
                  </div>
                </div>
                
                <CardHeader className="pb-2 pt-4 relative z-20">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="font-orbitron font-bold text-xs bg-secondary">
                      ROUND {race.round_number < 10 ? `0${race.round_number}` : race.round_number}
                    </Badge>
                    <span className={`text-xs font-bold font-rajdhani uppercase ${
                      race.status === "completed" ? "text-muted-foreground" : 
                      race.status === "upcoming" ? "text-primary animate-pulse" : "text-blue-400"
                    }`}>
                      {race.status}
                    </span>
                  </div>
                  <CardTitle className="font-orbitron text-xl leading-tight">{race.track_name}</CardTitle>
                  <CardDescription className="font-exo2 text-xs flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {race.seasons?.championships?.name} - {race.seasons?.name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="mt-auto pt-4 border-t border-border/40 bg-muted/10">
                  <div className="flex justify-between items-center font-exo2 text-sm">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      {raceDate.toLocaleDateString('pt-BR')}
                    </div>
                    
                    {race.status === "completed" ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Trophy className="w-3 h-3" />
                        <span className="font-bold text-foreground">Ver Resultado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{raceDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
