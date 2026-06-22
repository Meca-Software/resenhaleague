"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { lookupEmailByUsername } from "@/app/actions/auth-actions";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      let finalEmail = identifier;

      // Se o identificador não tem '@', assumimos que é um username e buscamos o email
      if (!identifier.includes("@")) {
        const foundEmail = await lookupEmailByUsername(identifier);
        if (!foundEmail) {
          setError("Usuário não encontrado.");
          setIsLoading(false);
          return;
        }
        finalEmail = foundEmail;
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: password,
        });

      if (authError || !authData.user) {
        setError("E-mail/Usuário ou senha incorretos.");
        setIsLoading(false);
        return;
      }

      // Redirecionamento baseado no cargo (armazenado no metadata do user)
      const role = authData.user.user_metadata?.role || "pilot";

      let targetPath = "/admin";
      if (role === "pilot") {
        targetPath = "/portal";
      } else if (role === "steward") {
        targetPath = "/admin/stewards";
      }

      router.push(targetPath);
      // Forçar atualização do router para processar middleware
      router.refresh();
    } catch (err) {
      setError("Erro ao tentar conectar com o servidor.");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-primary blur-[150px] opacity-10 rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <CardTitle className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Resenha League"
                width={220}
                height={60}
                className="h-14 w-auto object-contain"
              />
            </CardTitle>
            <CardDescription className="font-exo2 text-base">
              Acesso restrito ao sistema da liga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-destructive/10 border-destructive/50 text-destructive font-exo2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="identifier"
                  className="font-rajdhani font-bold text-muted-foreground uppercase tracking-wider text-xs"
                >
                  E-mail ou Username
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Email ou Username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-background/50 border-border/50 font-exo2 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-rajdhani font-bold text-muted-foreground uppercase tracking-wider text-xs"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-border/50 font-exo2 h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full font-rajdhani font-bold tracking-widest h-12 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  "AUTENTICANDO..."
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" /> ENTRAR NO SISTEMA
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-border/40 pt-6 gap-2">
            <p className="text-sm text-muted-foreground font-exo2 text-center">
              Dúvidas sobre o acesso? Entre em contato via Discord.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
