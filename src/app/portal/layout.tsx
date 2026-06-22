"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Video, ShieldAlert, LogOut, ChevronLeft, Trophy, Settings, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

const sidebarLinks = [
  { name: "Próxima Corrida", href: "/portal/proxima-corrida", icon: Calendar },
  { name: "Configurações", href: "/portal", icon: Settings },
  { name: "Evidências e Corridas", href: "/portal/evidencias", icon: Video },
  { name: "Minha Super Licença", href: "/portal/licenca", icon: ShieldAlert },
  { name: "Minhas Conquistas", href: "/portal/conquistas", icon: Trophy },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{name: string, team: string, avatar: string} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      const uid = session?.user?.id || null;
      setUserId(uid);

      if (uid) {
        const { data: userData } = await supabase
          .from('system_users')
          .select('*')
          .eq('id', uid)
          .single();
          
        if (userData) {
          const { data: pilotData } = await supabase
            .from('pilots')
            .select('*, teams(name)')
            .eq('profile_id', uid)
            .single();
            
          setProfileData({
            name: userData.full_name || userData.username || "Membro Resenha",
            team: pilotData?.teams?.name || "Agente Livre",
            avatar: userData.avatar_url || pilotData?.avatar_url || ""
          });
        }
      }
    };
    
    loadData();
  }, []);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabaseClient = createClient();
    await supabaseClient.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-background pt-16 mt-[-64px]">
      {/* SIDEBAR DO PILOTO */}
      <aside className="w-64 border-r border-border/40 bg-card/40 backdrop-blur-md hidden md:flex flex-col h-full overflow-y-auto">
        <div className="p-6 flex flex-col items-center gap-4 text-center mt-4">
          <Avatar className="w-20 h-20 border-2 border-primary shadow-xl">
            <AvatarImage src={profileData?.avatar || ""} alt="User" className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary font-rajdhani text-2xl font-bold">
              {profileData?.name ? profileData.name.substring(0, 2).toUpperCase() : "PL"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-orbitron font-bold text-foreground uppercase tracking-wide">
              {profileData?.name || "Carregando..."}
            </h2>
            <p className="text-xs text-primary font-exo2 font-bold uppercase mt-1">
              {profileData ? profileData.team : "Carregando..."}
            </p>
          </div>
          {userId && (
            <Link href={`/profile/${userId}`} className="w-full mt-2">
              <Button variant="outline" size="sm" className="w-full font-exo2 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
                Ver Perfil Público
              </Button>
            </Link>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/portal" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-exo2 transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-primary font-bold bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40 mt-auto">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground mb-2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
          <Button variant="destructive" className="w-full justify-start bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 transition-all font-rajdhani tracking-wider font-bold" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            DESCONECTAR
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="p-4 md:p-8 max-w-5xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
