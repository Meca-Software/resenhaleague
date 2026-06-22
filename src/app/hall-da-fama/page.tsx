"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Star, Award, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HallOfFamePage() {
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select('*, pilots(id, name, system_users(id, full_name, username)), teams(id, name, color, logo_url), seasons(name)');

      if (data) {
        setHallOfFame(data);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'champion':
        return <Crown className="w-8 h-8 text-amber-500" />;
      case 'record':
        return <Star className="w-8 h-8 text-amber-700" />;
      default:
        return <Award className="w-8 h-8 text-gray-400" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'champion':
        return 'amber-500';
      case 'record':
        return 'amber-700';
      default:
        return 'gray-400';
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight flex items-center gap-3 text-amber-500">
            <Crown className="w-10 h-10" /> HALL DA FAMA
          </h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            A história da Resenha League. Celebrando nossos maiores campeões e lendas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : hallOfFame.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground font-exo2">O Hall da Fama ainda está vazio. Grandes lendas estão sendo forjadas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hallOfFame.map((item) => {
            const colorClass = getColorForType(item.type);
            const shadowColor = item.type === 'champion' ? 'rgba(245,158,11,0.2)' : item.type === 'record' ? 'rgba(180,83,9,0.2)' : 'rgba(156,163,175,0.2)';
            
            let displayName = "Desconhecido";
            let profileLink = null;
            if (item.pilots) {
              displayName = item.pilots.system_users?.full_name || item.pilots.system_users?.username || item.pilots.name;
              if (item.pilots.system_users?.id) {
                profileLink = `/profile/${item.pilots.system_users.id}`;
              }
            } else if (item.teams) {
              displayName = item.teams.name;
            }

            return (
              <Card 
                key={item.id} 
                className={`bg-card/50 border-${colorClass}/50 hover:shadow-[0_0_20px_${shadowColor}] transition-all flex flex-col relative`}
              >
                <CardHeader className="text-center pb-2 flex-1">
                  <div className={`mx-auto w-16 h-16 bg-${colorClass}/10 rounded-full flex items-center justify-center mb-4 border border-${colorClass}/50`}>
                    {getIconForType(item.type)}
                  </div>
                  <CardDescription className={`font-rajdhani uppercase tracking-widest text-${colorClass} font-bold`}>
                    {item.title}
                  </CardDescription>
                  <CardTitle className="font-orbitron text-2xl flex items-center justify-center gap-2 mt-2">
                    {profileLink ? (
                      <a href={profileLink} className="hover:text-primary transition-colors hover:underline underline-offset-4">
                        {displayName}
                      </a>
                    ) : (
                      <span>{displayName}</span>
                    )}
                    {item.teams && (
                      <div title={`Equipe: ${item.teams.name}`} className="flex items-center ml-1">
                        {item.teams.logo_url ? (
                          <img src={item.teams.logo_url} alt={item.teams.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span 
                            className="inline-block w-4 h-4 rounded-full shadow-sm shrink-0" 
                            style={{ backgroundColor: item.teams.color || '#666' }}
                          />
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center shrink-0">
                  <p className="text-sm font-exo2 text-muted-foreground">{item.description}</p>
                  {item.seasons?.name && (
                     <p className="text-xs font-exo2 text-muted-foreground mt-4 pt-4 border-t border-border/40">
                       {item.seasons.name}
                     </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
