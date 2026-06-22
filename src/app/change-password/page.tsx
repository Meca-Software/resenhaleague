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
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forcePasswordChange } from "@/app/actions/auth-actions";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await forcePasswordChange(password);
      
      if (!response.success) {
        setError(response.error || "Erro ao atualizar a senha.");
        setIsLoading(false);
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      
      // Redirect to target path and refresh
      if (response.targetPath) {
        router.push(response.targetPath);
      } else {
        router.push("/admin");
      }
      
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
              Este é o seu primeiro acesso. Por questões de segurança, você precisa definir uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  htmlFor="password"
                  className="font-rajdhani font-bold text-muted-foreground uppercase tracking-wider text-xs"
                >
                  Nova Senha
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

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="font-rajdhani font-bold text-muted-foreground uppercase tracking-wider text-xs"
                >
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-border/50 font-exo2 h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full font-rajdhani font-bold tracking-widest h-12 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  "ATUALIZANDO..."
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" /> DEFINIR NOVA SENHA
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-border/40 pt-6 gap-2">
            <p className="text-sm text-muted-foreground font-exo2 text-center">
              Use uma senha forte que você não usa em outros sites.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
