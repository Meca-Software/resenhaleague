"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, ChevronRight, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function NoticiasPage() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });
        
      if (data) {
        setNewsList(data);
      }
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> NOTÍCIAS
          </h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Fique por dentro de tudo o que acontece na Resenha League e no mundo do F1 Esports.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar notícia..." 
            className="pl-10 bg-card/50 border-border/50 font-exo2"
          />
        </div>
      </div>

      {isLoading ? (
         <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Carregando notícias...</p></div>
      ) : newsList.length === 0 ? (
         <div className="flex justify-center py-12"><p className="text-muted-foreground font-exo2">Nenhuma notícia encontrada.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((news) => (
            <Link href={`/noticias/${news.slug}`} key={news.id}>
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors overflow-hidden group h-full flex flex-col cursor-pointer">
                <div className="h-48 bg-muted relative overflow-hidden shrink-0">
                  {news.cover_url ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                      style={{ backgroundImage: `url(${news.cover_url})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                  )}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary text-primary-foreground text-xs font-bold font-rajdhani px-2 py-1 uppercase rounded">
                      {news.category || "Geral"}
                    </span>
                  </div>
                </div>
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="text-xs text-muted-foreground font-exo2 mb-2 flex items-center gap-1">
                    <Timer className="w-3 h-3" /> 
                    {news.published_at 
                       ? new Date(news.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                       : new Date(news.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <h3 className="font-orbitron font-bold text-xl leading-tight group-hover:text-primary transition-colors mb-3">
                    {news.title}
                  </h3>
                  {news.content && (
                    <p className="text-sm text-muted-foreground font-exo2 line-clamp-3 mb-4 flex-1">
                      {news.content.substring(0, 150)}...
                    </p>
                  )}
                  <div className="mt-auto font-rajdhani font-bold text-sm text-primary flex items-center pt-2">
                    Ler Notícia <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {!isLoading && newsList.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="font-rajdhani tracking-widest font-bold">
            CARREGAR MAIS NOTÍCIAS
          </Button>
        </div>
      )}
    </div>
  );
}
