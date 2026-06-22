"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Trophy, User, LogIn, LogOut, Settings, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Campeonatos", href: "/campeonatos" },
  { name: "Calendário", href: "/calendario" },
  { name: "Classificações", href: "/classificacoes" },
  { name: "Equipes", href: "/equipes" },
  { name: "Pilotos", href: "/pilotos" },
  { name: "Hall da Fama", href: "/hall-da-fama" },
  { name: "Notícias", href: "/noticias" },
  { name: "Regulamento", href: "/regulamento" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>("");

  useEffect(() => {
    const fetchSession = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setRole(session.user.user_metadata?.role || "pilot");
        setUserId(session.user.id);
        
        // Fetch real avatar from database
        const { data: userData } = await supabase
          .from('system_users')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();

        if (userData?.avatar_url) {
          setUserAvatar(userData.avatar_url);
        } else {
          setUserAvatar(localStorage.getItem("user_avatar") || "");
        }
      } else {
        setRole(null);
        setUserId(null);
        setUserAvatar("");
      }
    };
    
    fetchSession();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 gap-4">
        {/* Left side: Logo */}
        <div className="flex items-center flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Resenha League"
              width={260}
              height={70}
              className="h-14 lg:h-16 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center: Nav */}
        <div className="hidden lg:flex flex-none justify-center">
          <nav className="flex items-center space-x-4 xl:space-x-6 text-sm lg:text-[15px] font-medium font-rajdhani">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 whitespace-nowrap",
                  pathname === item.href
                    ? "text-foreground border-b-2 border-primary pb-1"
                    : "text-foreground/60",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side: Auth */}
        <div className="flex items-center justify-end space-x-4 flex-1">
          {role ? (
            <div className="flex items-center">
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full hidden sm:flex items-center justify-center outline-none hover:bg-accent hover:text-accent-foreground">
                <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                  <AvatarImage src={userAvatar} alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary font-rajdhani font-bold">
                    ME
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 font-exo2 bg-background/95 backdrop-blur border-border/50"
                align="end"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Minha Conta
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        Nível: {role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50" />

                <DropdownMenuItem
                  render={<Link href={userId ? `/profile/${userId}` : "#"} />}
                  className="cursor-pointer focus:bg-primary/10"
                >
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span>Visualizar Meu Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/portal" />}
                  className="cursor-pointer focus:bg-primary/10"
                >
                  <Settings className="mr-2 h-4 w-4 text-primary" />
                  <span>Editar Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/portal/evidencias" />}
                  className="cursor-pointer focus:bg-primary/10"
                >
                  <Video className="mr-2 h-4 w-4 text-primary" />
                  <span>Enviar Evidências</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/portal/proxima-corrida" />}
                  className="cursor-pointer focus:bg-primary/10"
                >
                  <Trophy className="mr-2 h-4 w-4 text-primary" />
                  <span>Confirmar Presença</span>
                </DropdownMenuItem>

                {(role === "superadmin" || role === "admin") && (
                  <DropdownMenuItem
                    render={<Link href="/admin" />}
                    className="cursor-pointer focus:bg-primary/10"
                  >
                    <Trophy className="mr-2 h-4 w-4 text-primary" />
                    <span>Painel Admin</span>
                  </DropdownMenuItem>
                )}

                {(role === "superadmin" || role === "steward") && (
                  <DropdownMenuItem
                    render={<Link href="/admin/stewards" />}
                    className="cursor-pointer focus:bg-primary/10"
                  >
                    <Trophy className="mr-2 h-4 w-4 text-primary" />
                    <span>Painel Comissários</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={async () => {
                    const { createClient } = await import("@/lib/supabase/client");
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    localStorage.removeItem("user_avatar");
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="font-exo2 text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            className="lg:hidden px-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-border/40 bg-background/95 backdrop-blur px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3 font-rajdhani text-base">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "transition-colors hover:text-foreground/80 block",
                  pathname === item.href
                    ? "text-primary font-bold"
                    : "text-foreground/60",
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border/40 space-y-2">
              {role ? (
                <>
                  <Link href={userId ? `/profile/${userId}` : "#"} onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full font-exo2 bg-primary/20 text-primary hover:bg-primary/30">
                      <User className="mr-2 h-4 w-4" /> Visualizar Meu Perfil
                    </Button>
                  </Link>
                  <Link href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full font-exo2 bg-primary/20 text-primary hover:bg-primary/30">
                      <Settings className="mr-2 h-4 w-4" /> Editar Perfil
                    </Button>
                  </Link>
                  <Link href="/portal/proxima-corrida" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full font-exo2 bg-primary/20 text-primary hover:bg-primary/30">
                      <Trophy className="mr-2 h-4 w-4" /> Confirmar Presença
                    </Button>
                  </Link>
                  {(role === "superadmin" || role === "admin") && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full font-exo2 bg-primary/20 text-primary hover:bg-primary/30">
                        <Trophy className="mr-2 h-4 w-4" /> Painel Admin
                      </Button>
                    </Link>
                  )}
                  {(role === "superadmin" || role === "steward") && (
                    <Link
                      href="/admin/stewards"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full font-exo2 bg-primary/20 text-primary hover:bg-primary/30">
                        <Trophy className="mr-2 h-4 w-4" /> Painel Comissários
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <Button className="w-full font-exo2">
                    <LogIn className="mr-2 h-4 w-4" /> Acessar Painel
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
