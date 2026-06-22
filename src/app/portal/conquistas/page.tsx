"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Flag, Star, ChevronLeft, ShieldAlert, Zap, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function PortalConquistasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [myPilotId, setMyPilotId] = useState<string | null>(null);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      const userId = session?.user?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Pega o piloto do usuário logado
      const { data: myPilot } = await supabase.from('pilots').select('*').eq('profile_id', userId).single();
      
      if (myPilot) {
        setMyPilotId(myPilot.id);

        const { data: badgesData } = await supabase
          .from('pilot_badges')
          .select('id, is_pinned, badges(*)')
          .eq('pilot_id', myPilot.id)
          .order('earned_at', { ascending: false });

        if (badgesData) {
          setMyBadges(badgesData);
          setPinnedIds(badgesData.filter(b => b.is_pinned).map(b => b.id));
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const togglePin = (id: string) => {
    if (pinnedIds.includes(id)) {
      setPinnedIds(pinnedIds.filter(pid => pid !== id));
    } else {
      if (pinnedIds.length >= 4) {
        toast.error("Limite de Vitrine", { description: "Você pode fixar no máximo 4 conquistas na vitrine pública." });
        return;
      }
      setPinnedIds([...pinnedIds, id]);
    }
  };

  const handleSave = async () => {
    if (!myPilotId) return;
    setIsSaving(true);
    
    // Zera os pins atuais
    await supabase.from('pilot_badges').update({ is_pinned: false }).eq('pilot_id', myPilotId);
    
    // Atualiza os selecionados
    for (const pid of pinnedIds) {
      await supabase.from('pilot_badges').update({ is_pinned: true }).eq('id', pid);
    }
    
    setIsSaving(false);
    toast.success("Vitrine Atualizada", { description: "Suas conquistas fixadas foram salvas e já aparecem no seu perfil público!" });
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'legendary': return 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30';
      case 'epic': return 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30';
      case 'rare': return 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30';
      default: return 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30';
    }
  };

  const getRarityText = (type: string) => {
    switch (type) {
      case 'legendary': return 'Lendário';
      case 'epic': return 'Épico';
      case 'rare': return 'Raro';
      default: return 'Comum';
    }
  };

  const renderIcon = (iconName: string, rarity: string) => {
    const getColors = () => {
      switch (rarity) {
        case 'legendary': return 'text-yellow-500';
        case 'epic': return 'text-purple-500';
        case 'rare': return 'text-blue-500';
        default: return 'text-green-500';
      }
    };
    const c = getColors();
    switch (iconName) {
      case 'trophy': return <Trophy className={`w-8 h-8 ${c}`} />;
      case 'star': return <Star className={`w-8 h-8 ${c}`} />;
      case 'award': return <Award className={`w-8 h-8 ${c}`} />;
      case 'shield': return <ShieldAlert className={`w-8 h-8 ${c}`} />;
      case 'flame': return <Flame className={`w-8 h-8 ${c}`} />;
      case 'zap': return <Zap className={`w-8 h-8 ${c}`} />;
      case 'flag': return <Flag className={`w-8 h-8 ${c}`} />;
      default: return <Trophy className={`w-8 h-8 ${c}`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" /> MINHAS CONQUISTAS
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Exiba suas maiores glórias para toda a liga. Escolha até 4 conquistas para destacar.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="font-exo2 font-bold tracking-widest shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          SALVAR VITRINE
        </Button>
      </div>

      {!myPilotId ? (
        <Card className="bg-destructive/10 border-destructive/20 text-destructive text-center p-8 font-exo2">
          Você precisa estar vinculado a um piloto para ter conquistas.
        </Card>
      ) : (
        <>
          {/* VITRINE PRINCIPAL (OS PINS) */}
          <Card className="bg-card/40 border-primary/20 backdrop-blur-md shadow-lg shadow-primary/5">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" /> Vitrine Principal
                </CardTitle>
                <Badge variant="outline" className="font-rajdhani border-primary/50 text-primary bg-primary/10">
                  {pinnedIds.length} / 4 Slots
                </Badge>
              </div>
              <CardDescription className="font-exo2">Estas conquistas aparecerão com destaque no seu Perfil Público.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((index) => {
                  const pinnedId = pinnedIds[index];
                  const pilotBadge = pinnedId ? myBadges.find(b => b.id === pinnedId) : null;
                  const badge = pilotBadge?.badges;

                  if (badge) {
                    return (
                      <div key={`pin-${index}`} className={`group relative flex flex-col items-center text-center space-y-3 p-4 rounded-xl border transition-all cursor-pointer ${getBgColor(badge.rarity)}`} onClick={() => togglePin(pilotBadge.id)}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/50 hover:bg-destructive/20 hover:text-destructive">
                            <ChevronLeft className="w-3 h-3 -rotate-90" />
                          </Button>
                        </div>
                        <div className="relative w-16 h-16 transition-transform duration-300 group-hover:scale-110">
                          <div className="absolute inset-0 bg-background/50 rounded-full blur-md" />
                          <div className="relative w-full h-full bg-linear-to-br from-background to-muted rounded-full flex items-center justify-center border-2 border-border shadow-xl">
                            {renderIcon(badge.icon_url, badge.rarity)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-rajdhani font-bold text-sm leading-tight">{badge.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-exo2 mt-1">{getRarityText(badge.rarity)}</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={`empty-${index}`} className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-border/50 bg-background/20 h-full min-h-[140px]">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted flex items-center justify-center mb-2">
                          <Trophy className="w-5 h-5 text-muted opacity-50" />
                        </div>
                        <p className="text-xs text-muted-foreground font-exo2">Slot Vazio</p>
                      </div>
                    );
                  }
                })}
              </div>
            </CardContent>
          </Card>

          {/* INVENTÁRIO (TODAS AS CONQUISTAS) */}
          <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Inventário de Conquistas
              </CardTitle>
              <CardDescription className="font-exo2">Todas as glórias que você já conquistou na liga. Clique em uma para adicionar ou remover da Vitrine Principal.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {myBadges.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground font-exo2 border border-dashed border-border/50 rounded-lg">
                  Você ainda não possui nenhuma conquista. Continue correndo para desbloquear!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {myBadges.map((pilotBadge) => {
                    const badge = pilotBadge.badges;
                    if (!badge) return null;
                    const isPinned = pinnedIds.includes(pilotBadge.id);
                    
                    return (
                      <div 
                        key={pilotBadge.id} 
                        onClick={() => togglePin(pilotBadge.id)}
                        className={`group relative flex flex-col items-center text-center space-y-3 p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-1 ${getBgColor(badge.rarity)} ${isPinned ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'}`}
                      >
                        {isPinned && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg z-10">
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                        )}
                        <div className="relative w-14 h-14 transition-transform duration-300">
                          <div className="absolute inset-0 bg-background/50 rounded-full blur-md" />
                          <div className="relative w-full h-full bg-linear-to-br from-background to-muted rounded-full flex items-center justify-center border-2 border-border shadow-xl">
                            {renderIcon(badge.icon_url, badge.rarity)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-rajdhani font-bold text-sm leading-tight">{badge.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-exo2 mt-1 line-clamp-2">{badge.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
