"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Flag,
  Settings,
  LogOut,
  FileText,
  Gavel,
  ChevronLeft,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Award,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const allSidebarLinks = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    name: "Resultados",
    href: "/admin/resultados",
    icon: FileSpreadsheet,
    module: "resultados",
  },
  {
    name: "Pilotos & Equipes",
    href: "/admin/pilotos",
    icon: Users,
    module: "pilotos",
  },
  {
    name: "Campeonatos",
    href: "/admin/campeonatos",
    icon: Trophy,
    module: "campeonatos",
  },
  { name: "Corridas", href: "/admin/corridas", icon: Flag, module: "corridas" },
  {
    name: "Presenças da Etapa",
    href: "/admin/presencas",
    icon: Flag,
    module: "corridas",
  },
  {
    name: "Centro de Comissários",
    href: "/admin/stewards",
    icon: Gavel,
    module: "stewards",
  },
  {
    name: "Notícias",
    href: "/admin/noticias",
    icon: FileText,
    module: "noticias",
  },
  {
    name: "Regulamento",
    href: "/admin/regulamento",
    icon: FileText,
    module: "noticias",
  },
  {
    name: "Gestão de Contas",
    href: "/admin/contas",
    icon: Users,
    module: "contas",
  },
  {
    name: "Controle de Acessos",
    href: "/admin/permissoes",
    icon: Lock,
    module: "permissoes",
  },
  {
    name: "Gerenciar Conquistas",
    href: "/admin/conquistas",
    icon: Award,
    module: "conquistas",
  },
  {
    name: "Hall da Fama",
    href: "/admin/hall-da-fama",
    icon: Crown,
    module: "hall_da_fama",
  },
  {
    name: "Configurações",
    href: "/admin/config",
    icon: Settings,
    module: "config",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [userRoleName, setUserRoleName] = useState("carregando...");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const fetchUserRole = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const fallbackRole = session.user.user_metadata?.role || "pilot";
        const userId = session.user.id;

        setUserRoleName(fallbackRole.toUpperCase());
        if (fallbackRole === "superadmin" || fallbackRole === "admin") {
          setUserPermissions([
            "dashboard",
            "resultados",
            "pilotos",
            "campeonatos",
            "corridas",
            "stewards",
            "contas",
            "noticias",
            "config",
            "permissoes",
            "conquistas",
            "hall_da_fama",
          ]);
        } else if (fallbackRole === "steward") {
          setUserPermissions(["dashboard", "resultados", "stewards"]);
        } else {
          setUserPermissions(["dashboard"]);
        }

        // Tenta buscar no banco para sobrescrever com as permissões dinâmicas
        const { data: userData, error } = await supabase
          .from("system_users")
          .select("role, roles(name, permissions)")
          .eq("id", userId)
          .single();

        if (userData && !error) {
          if (userData.roles) {
            const userRoleObj = userData.roles as any;
            setUserRoleName(userRoleObj.name);
            // Sobrescreve com as permissões verdadeiras do banco se for um array
            if (Array.isArray(userRoleObj.permissions)) {
              setUserPermissions(userRoleObj.permissions);
            }
          }
        }
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-background pt-16 mt-[-64px]">
      {/* SIDEBAR DO ADMIN */}
      <aside className="w-64 border-r border-border/40 bg-card/40 backdrop-blur-md hidden md:flex flex-col h-full overflow-y-auto">
        <div className="p-6 flex flex-col items-center gap-2 text-center mt-4">
          <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-orbitron font-bold text-foreground mt-2 tracking-widest text-sm uppercase">
            Comando Geral
          </h2>
          <p className="text-xs text-muted-foreground font-exo2 uppercase">
            {isMounted ? userRoleName : "carregando..."}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {isMounted &&
            allSidebarLinks
              .filter((link) => userPermissions.includes(link.module))
              .map((link) => {
                const Icon = link.icon;
                // Verifica se é a exata rota ou uma subrota (exceto para o dashboard principal para não ficar sempre ativo)
                const isActive =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg font-exo2 transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? "text-primary font-bold bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                    )}
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive ? "text-primary" : "",
                      )}
                    />
                    {link.name}
                  </Link>
                );
              })}
        </nav>

        <div className="p-4 border-t border-border/40 mt-auto space-y-2">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Ver Site Público
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="w-full justify-start bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 transition-all font-rajdhani tracking-wider font-bold"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            DESCONECTAR
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
