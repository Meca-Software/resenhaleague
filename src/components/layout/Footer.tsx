"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Globe, MessageSquare, Camera, MessageCircle, MonitorPlay, Video } from "lucide-react";

type SocialNetwork = {
  id: string;
  name: string;
  active: boolean;
  url: string;
};

const getIcon = (id: string) => {
  switch (id) {
    case "discord": return MessageSquare;
    case "instagram": return Camera;
    case "twitter": return MessageCircle;
    case "twitch": return MonitorPlay;
    case "youtube": return Video;
    default: return Globe;
  }
};

export function Footer() {
  const [socials, setSocials] = useState<SocialNetwork[]>([]);

  useEffect(() => {
    const savedSocials = localStorage.getItem("resenha_socials");
    if (savedSocials) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocials(JSON.parse(savedSocials).filter((s: SocialNetwork) => s.active && s.url));
    }
  }, []);

  return (
    <footer className="border-t border-border/40 bg-background/95 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left max-w-xl">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Resenha League" width={180} height={40} className="h-10 w-auto object-contain" />
            </Link>
            <p className="text-sm text-muted-foreground font-exo2">
              Plataforma profissional para gerenciamento de campeonatos virtuais de Fórmula 1. 
              Elevando o nível do eSports no Brasil.
            </p>
            <div className="flex space-x-4 pt-2 flex-wrap gap-y-2 justify-center md:justify-start">
              {socials.length > 0 ? (
                socials.map((social) => {
                  const Icon = getIcon(social.id);
                  return (
                    <Link key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{social.name}</span>
                    </Link>
                  );
                })
              ) : (
                <>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">Discord</span>
                  </Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs">Redes Sociais</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-exo2">
          <p>© {new Date().getFullYear()} Resenha League. Todos os direitos reservados.</p>
          <p>Não afiliado à FIA, Fórmula 1 ou EA SPORTS.</p>
        </div>
      </div>
    </footer>
  );
}
