"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Medal, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PilotosPage() {
  const [pilots, setPilots] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPilots = async () => {
      const { data, error } = await supabase
        .from('pilots')
        .select('*, teams(name, color, logo_url), system_users(*)')
        .not('season_id', 'is', null);
      
      if (data) setPilots(data);
      setIsLoading(false);
    };

    fetchPilots();
  }, []);

  const filteredPilots = pilots.filter(p => {
    const displayName = p.system_users?.full_name || p.system_users?.username || p.name || "";
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight">PILOTOS</h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Conheça os competidores oficiais que formam o grid da Resenha League.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar piloto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border/50 font-exo2"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Carregando pilotos...</p></div>
      ) : filteredPilots.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Nenhum piloto encontrado.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPilots.map((pilot) => {
            const stats = pilot.stats || {};
            const points = stats.points || 0;
            const wins = stats.wins || 0;
            const podiums = stats.podiums || 0;
            
            return (
              <Link href={`/profile/${pilot.profile_id || pilot.id}`} key={pilot.id} className="block">
                <Card className="h-full overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-colors group cursor-pointer shadow-lg hover:shadow-primary/10">
                  <div className="h-24 bg-linear-to-r from-muted to-muted/30 relative flex items-center px-6" style={{ borderBottom: `4px solid ${pilot.teams?.color || '#333'}` }}>
                    <div className="text-6xl font-black font-orbitron text-foreground/5 absolute -right-2 -bottom-2 z-0 italic tracking-tighter">
                      {pilot.number}
                    </div>
                    <div className="z-10 flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-background shadow-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 relative z-20">
                          {pilot.system_users?.avatar_url || pilot.avatar_url ? (
                            <img src={pilot.system_users?.avatar_url || pilot.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Image src="/logo.png" alt="Avatar" width={40} height={40} className="opacity-50" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="font-orbitron text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                            {pilot.system_users?.full_name || pilot.system_users?.username || pilot.name}
                            <img src={`https://flagcdn.com/w40/${(pilot.system_users?.nationality || pilot.nationality || 'br').substring(0,2).toLowerCase()}.png`} alt="Flag" className="w-6 h-4 object-cover rounded-sm ml-1 opacity-90 shadow-sm" />
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {pilot.teams?.logo_url && (
                              <img src={pilot.teams.logo_url} alt={pilot.teams.name} className="h-5 object-contain drop-shadow-md" />
                            )}
                            <CardDescription className="font-rajdhani text-base text-primary font-bold">
                              {pilot.teams ? pilot.teams.name : "Agente Livre"}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 pt-6 bg-background/50">
                    <div className="grid grid-cols-3 gap-4 divide-x divide-border/50 text-center">
                      <div className="space-y-1 px-2">
                        <div className="text-xs text-muted-foreground font-rajdhani uppercase font-bold flex justify-center items-center gap-1">
                          <Target className="w-3 h-3" /> PTS
                        </div>
                        <div className="font-orbitron font-bold text-xl">{points}</div>
                      </div>
                      <div className="space-y-1 px-2">
                        <div className="text-xs text-muted-foreground font-rajdhani uppercase font-bold flex justify-center items-center gap-1">
                          <Trophy className="w-3 h-3" /> VIT
                        </div>
                        <div className="font-orbitron font-bold text-xl">{wins}</div>
                      </div>
                      <div className="space-y-1 px-2">
                        <div className="text-xs text-muted-foreground font-rajdhani uppercase font-bold flex justify-center items-center gap-1">
                          <Medal className="w-3 h-3" /> PÓDIOS
                        </div>
                        <div className="font-orbitron font-bold text-xl">{podiums}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
