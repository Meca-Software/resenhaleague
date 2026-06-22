"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Geral");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const fetchNews = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (data) setNews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  const handleCreateNews = async () => {
    if (!title || !slug || !content) {
      return toast.error("Preencha o título, slug e o conteúdo da notícia.");
    }

    const { error } = await supabase.from('news').insert([
      {
        title,
        slug,
        category,
        content,
        cover_url: coverUrl,
        // O author_id idealmente viria do usuário logado
      }
    ]);

    if (error) {
      toast.error("Erro ao publicar: " + error.message);
    } else {
      setIsCreating(false);
      setTitle("");
      setSlug("");
      setCategory("Geral");
      setContent("");
      setCoverUrl("");
      fetchNews();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta notícia?")) {
      await supabase.from('news').delete().eq('id', id);
      fetchNews();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> PORTAL DE NOTÍCIAS
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Publique novidades, comunicados oficiais e resumos de corridas.
          </p>
        </div>
        <Button className="font-rajdhani font-bold" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" /> NOVA PUBLICAÇÃO
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Criar Nova Notícia</CardTitle>
            <CardDescription className="font-exo2">Preencha os dados abaixo para publicar no portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Título</label>
                <Input value={title} onChange={handleTitleChange} placeholder="Ex: Resumo do GP" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Slug (URL)</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="resumo-do-gp" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Geral">Geral</option>
                  <option value="Corridas">Corridas</option>
                  <option value="Comissários">Comissários</option>
                  <option value="Equipes">Equipes</option>
                  <option value="Atualizações">Atualizações</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">URL da Imagem de Capa (Opcional)</label>
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className="bg-background/50 border-border/50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Conteúdo Completo</label>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Escreva a notícia detalhada..." 
                rows={6}
                className="bg-background/50 border-border/50" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleCreateNews} className="bg-green-600 hover:bg-green-700 font-bold font-rajdhani">Publicar Notícia</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">Notícias Publicadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando notícias...</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>TÍTULO</TableHead>
                  <TableHead className="text-center">CATEGORIA</TableHead>
                  <TableHead className="text-center">DATA</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.title}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-rajdhani uppercase">{item.category || 'Geral'}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {news.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma notícia publicada ainda.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
