"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Share2, MessageSquare, Camera, MessageCircle, MonitorPlay, Video } from "lucide-react";

type SocialNetwork = {
  id: string;
  name: string;
  icon: any;
  active: boolean;
  url: string;
};

export default function AdminConfigPage() {
  const [socials, setSocials] = useState<SocialNetwork[]>([
    { id: "discord", name: "Discord", icon: MessageSquare, active: false, url: "" },
    { id: "instagram", name: "Instagram", icon: Camera, active: false, url: "" },
    { id: "twitter", name: "Twitter/X", icon: MessageCircle, active: false, url: "" },
    { id: "twitch", name: "Twitch", icon: MonitorPlay, active: false, url: "" },
    { id: "youtube", name: "YouTube", icon: Video, active: false, url: "" },
  ]);

  const [leagueName, setLeagueName] = useState("Resenha League");

  useEffect(() => {
    const savedSocials = localStorage.getItem("resenha_socials");
    if (savedSocials) {
      const parsed = JSON.parse(savedSocials);
      setSocials((prev) => 
        prev.map(social => {
          const found = parsed.find((s: any) => s.id === social.id);
          return found ? { ...social, active: found.active, url: found.url } : social;
        })
      );
    }
    const savedName = localStorage.getItem("resenha_league_name");
    if (savedName) setLeagueName(savedName);
  }, []);

  const handleSaveSocials = () => {
    const toSave = socials.map(({ id, active, url }) => ({ id, active, url }));
    localStorage.setItem("resenha_socials", JSON.stringify(toSave));
    // Provide some visual feedback
    const btn = document.getElementById("btn-save-socials");
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = "SALVO COM SUCESSO!";
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  };

  const handleSaveGeneral = () => {
    localStorage.setItem("resenha_league_name", leagueName);
    const btn = document.getElementById("btn-save-general");
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = "SALVO COM SUCESSO!";
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  };

  const updateSocial = (id: string, field: "active" | "url", value: any) => {
    setSocials(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" /> CONFIGURAÇÕES DO SISTEMA
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Gerencie preferências da liga e redes sociais integradas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron flex items-center gap-2 text-xl">
              <Share2 className="w-5 h-5 text-primary" /> Redes Sociais
            </CardTitle>
            <CardDescription className="font-exo2">
              Ative e configure os links das redes sociais que aparecerão no rodapé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 font-exo2">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <div key={social.id} className="space-y-2 border-b border-border/30 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <Label className="font-bold">{social.name}</Label>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={social.active}
                        onChange={(e) => updateSocial(social.id, "active", e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {social.active && (
                    <div className="pt-2">
                      <Input 
                        placeholder={`https://${social.id}.com/...`} 
                        className="bg-background/50 border-border/50 text-sm h-9" 
                        value={social.url}
                        onChange={(e) => updateSocial(social.id, "url", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            <Button 
              id="btn-save-socials" 
              onClick={handleSaveSocials} 
              className="w-full font-rajdhani font-bold mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> SALVAR REDES SOCIAIS
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-fit">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Preferências Gerais</CardTitle>
            <CardDescription className="font-exo2">
              Informações globais do campeonato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-exo2">
            <div className="space-y-2">
              <Label>Nome Oficial da Liga</Label>
              <Input 
                value={leagueName} 
                onChange={(e) => setLeagueName(e.target.value)}
                className="bg-background/50 border-border/50" 
              />
            </div>
            
            <Button 
              id="btn-save-general" 
              onClick={handleSaveGeneral} 
              variant="outline" 
              className="w-full font-rajdhani font-bold mt-4 border-primary/50 hover:bg-primary/10 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" /> SALVAR PREFERÊNCIAS
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
