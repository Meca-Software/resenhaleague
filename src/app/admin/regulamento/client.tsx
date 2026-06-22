"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, MoveUp, MoveDown, Save, X } from "lucide-react";
import { addRegulation, updateRegulation, deleteRegulation } from "@/app/actions/regulation-actions";

type Regulation = {
  id: string;
  title: string;
  content: string;
  order_index: number;
  section?: string;
};

export default function RegulamentoAdminClient({ initialRegulations }: { initialRegulations: Regulation[] }) {
  const [regulations, setRegulations] = useState<Regulation[]>(initialRegulations);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", section: "Geral" });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddNew = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Preencha o título e o conteúdo");
      return;
    }
    setIsLoading(true);
    const newOrderIndex = regulations.length > 0 ? Math.max(...regulations.map(r => r.order_index)) + 1 : 0;
    
    const res = await addRegulation(formData.title, formData.content, newOrderIndex);
    if (res.success) {
      toast.success("Tópico adicionado com sucesso!");
      setIsAdding(false);
      setFormData({ title: "", content: "", section: "Geral" });
      // In a real app we'd fetch the newly created one to get its ID, 
      // but since we are relying on server actions, we should probably just reload the page
      // or handle it gracefully. Next.js revalidatePath will refresh the route.
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao adicionar");
    }
    setIsLoading(false);
  };

  const handleUpdate = async (id: string, currentOrder: number) => {
    if (!formData.title || !formData.content) {
      toast.error("Preencha o título e o conteúdo");
      return;
    }
    setIsLoading(true);
    const res = await updateRegulation(id, formData.title, formData.content, currentOrder);
    if (res.success) {
      toast.success("Tópico atualizado com sucesso!");
      setEditingId(null);
      setFormData({ title: "", content: "", section: "Geral" });
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao atualizar");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tópico?")) return;
    setIsLoading(true);
    const res = await deleteRegulation(id);
    if (res.success) {
      toast.success("Tópico excluído!");
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao excluir");
    }
    setIsLoading(false);
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === regulations.length - 1) return;

    const newRegs = [...regulations];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newRegs[index].order_index;
    newRegs[index].order_index = newRegs[swapIndex].order_index;
    newRegs[swapIndex].order_index = tempOrder;

    // Sort to reflect changes locally
    newRegs.sort((a, b) => a.order_index - b.order_index);
    setRegulations(newRegs);

    // Update in DB (in parallel)
    setIsLoading(true);
    await Promise.all([
      updateRegulation(newRegs[index].id, newRegs[index].title, newRegs[index].content, newRegs[index].order_index),
      updateRegulation(newRegs[swapIndex].id, newRegs[swapIndex].title, newRegs[swapIndex].content, newRegs[swapIndex].order_index)
    ]);
    setIsLoading(false);
    toast.success("Ordem atualizada!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { setIsAdding(true); setFormData({ title: "", content: "", section: "Geral" }); }} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Tópico
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 border-2">
          <CardHeader>
            <CardTitle>Novo Tópico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                placeholder="Ex: 3. Sistema de Punições" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo (suporta HTML/Tags simples ou apenas quebras de linha)</label>
              <Textarea 
                placeholder="Insira as regras aqui..." 
                className="min-h-[150px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleAddNew} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-4">
        {regulations.map((reg, index) => (
          <Card key={reg.id} className={editingId === reg.id ? "border-primary/50 border-2" : ""}>
            {editingId === reg.id ? (
              <>
                <CardHeader>
                  <CardTitle>Editar Tópico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conteúdo</label>
                    <Textarea 
                      className="min-h-[150px]"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingId(null)} disabled={isLoading}>Cancelar</Button>
                  <Button onClick={() => handleUpdate(reg.id, reg.order_index)} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" /> Salvar
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-xl font-orbitron">{reg.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => moveOrder(index, 'up')} disabled={index === 0 || isLoading}>
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveOrder(index, 'down')} disabled={index === regulations.length - 1 || isLoading}>
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingId(reg.id);
                      setFormData({ title: reg.title, content: reg.content, section: reg.section || "Geral" });
                      setIsAdding(false);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(reg.id)} disabled={isLoading}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="whitespace-pre-wrap font-exo2 text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: reg.content }} 
                  />
                </CardContent>
              </>
            )}
          </Card>
        ))}
        {regulations.length === 0 && !isAdding && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum tópico cadastrado no regulamento.
          </div>
        )}
      </div>
    </div>
  );
}
