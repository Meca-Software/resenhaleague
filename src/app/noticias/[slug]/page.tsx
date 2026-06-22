"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Timer, Calendar, User } from "lucide-react";

export default function NoticiaDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Em um app real, buscaríamos a notícia pelo slug no Supabase
  const formatSlugToTitle = (s: string) => {
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 flex flex-col min-h-screen">
      <Link href="/noticias" className="mb-8">
        <Button variant="ghost" className="font-rajdhani hover:bg-muted/50 -ml-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR PARA NOTÍCIAS
        </Button>
      </Link>

      <article className="space-y-8">
        <header className="space-y-4">
          <Badge className="font-rajdhani tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary">
            E-SPORTS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron leading-tight text-foreground">
            {formatSlugToTitle(slug)}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-exo2 border-y border-border/40 py-4 mt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 20 Novembro, 2026
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" /> 3 min de leitura
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" /> Redação Resenha
            </div>
          </div>
        </header>

        <div className="w-full aspect-video bg-muted relative rounded-xl overflow-hidden border border-border/40">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-orbitron">
            [ Imagem de Capa da Notícia ]
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none font-exo2 text-muted-foreground">
          <p className="lead text-xl text-foreground font-medium mb-6">
            Esta é uma página de demonstração para a notícia correspondente ao link selecionado. No sistema final, este conteúdo será puxado diretamente do banco de dados do Supabase.
          </p>
          <p>
            A Resenha League continua crescendo e trazendo as melhores competições virtuais para o público brasileiro. Com o avanço do F1 26, novas dinâmicas foram introduzidas para tornar a simulação ainda mais realista e punitiva para erros dos pilotos.
          </p>
          <h2 className="text-2xl font-orbitron font-bold text-foreground mt-8 mb-4">O que muda para os pilotos?</h2>
          <p>
            As penalidades ficarão mais rígidas no novo update dos comissários. Toques leves sob frenagem agora podem resultar em perdas de posições no grid da próxima corrida, caso não haja devolução de posição ou dano ao adversário.
          </p>
          <blockquote className="border-l-4 border-primary pl-4 my-6 italic bg-muted/20 py-4 pr-4 rounded-r-lg">
            "Nosso objetivo é limpar as corridas e garantir que o espetáculo venha da habilidade, não dos acidentes na primeira curva." - Diretor de Prova
          </blockquote>
          <p>
            Fique ligado em nossas redes sociais para mais atualizações e não perca a transmissão oficial da próxima etapa no nosso canal da Twitch e YouTube.
          </p>
        </div>
      </article>
    </div>
  );
}
