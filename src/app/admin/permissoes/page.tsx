"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const AVAILABLE_MODULES = [
  { id: "dashboard", label: "Dashboard (Início)" },
  { id: "resultados", label: "Resultados de Corrida" },
  { id: "pilotos", label: "Gestão de Pilotos & Equipes" },
  { id: "campeonatos", label: "Gestão de Campeonatos" },
  { id: "corridas", label: "Gestão de Calendário (Corridas)" },
  { id: "stewards", label: "Centro de Comissários (Stewards)" },
  { id: "contas", label: "Gestão de Contas de Usuários" },
  { id: "noticias", label: "Gestão de Notícias" },
  { id: "config", label: "Configurações Gerais" },
  { id: "permissoes", label: "Controle de Permissões (RBAC)" },
];

export default function PermissoesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulário
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
    if (data) setRoles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (moduleId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(p => p !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleEdit = (role: any) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setIsCreatingRole(true);
  };

  const handleSaveRole = async () => {
    if (!roleName) return toast.success("Digite um nome para o cargo");

    setIsLoading(true);

    if (editingRoleId) {
      const { error } = await supabase
        .from('roles')
        .update({ name: roleName, permissions: selectedPermissions })
        .eq('id', editingRoleId);
      
      if (error) toast.error("Erro ao atualizar: " + error.message);
    } else {
      const { error } = await supabase
        .from('roles')
        .insert([{ name: roleName, permissions: selectedPermissions }]);
      
      if (error) toast.error("Erro ao criar: " + error.message);
    }

    setRoleName("");
    setSelectedPermissions([]);
    setEditingRoleId(null);
    setIsCreatingRole(false);
    fetchRoles();
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (name === "Superadmin" || name === "Piloto") {
      return toast.error("Cargos padrão do sistema não podem ser deletados.");
    }
    if (confirm("Apagar este cargo permanentemente? Usuários com este cargo perderão os acessos.")) {
      const { error } = await supabase.from('roles').delete().eq('id', id);
      if (error) toast.error(error.message);
      else fetchRoles();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> CONTROLE DE ACESSOS (RBAC)
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Crie categorias (cargos) personalizadas e defina exatamente quais módulos elas podem acessar.
          </p>
        </div>
        <Button className="font-rajdhani font-bold" onClick={() => { 
          setIsCreatingRole(!isCreatingRole); 
          setEditingRoleId(null);
          setRoleName("");
          setSelectedPermissions([]);
        }}>
          <Plus className="w-4 h-4 mr-2" /> NOVO CARGO
        </Button>
      </div>

      {isCreatingRole && (
        <Card className="bg-card/50 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">
              {editingRoleId ? `Editando Cargo: ${roleName}` : "Criar Novo Cargo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Nome do Cargo / Categoria</label>
                <Input 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)} 
                  placeholder="Ex: Diretor Esportivo, Jornalista, Comissário Trainee..." 
                  className="bg-background/50 border-border/50 max-w-md" 
                />
              </div>

              <div>
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground mb-3 block">Módulos Permitidos para este Cargo</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map(mod => {
                    const isChecked = selectedPermissions.includes(mod.id);
                    return (
                      <div 
                        key={mod.id}
                        onClick={() => handleTogglePermission(mod.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-primary/10 border-primary text-foreground' : 'bg-background/50 border-border/50 text-muted-foreground hover:bg-muted/50'}`}
                      >
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-primary pointer-events-none" 
                          checked={isChecked}
                          readOnly
                        />
                        <span className="font-exo2 text-sm">{mod.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                <Button variant="ghost" onClick={() => setIsCreatingRole(false)}>Cancelar</Button>
                <Button onClick={handleSaveRole} className="bg-green-600 hover:bg-green-700 font-bold">
                  {editingRoleId ? "Salvar Alterações" : "Salvar Novo Cargo"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">Cargos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>CARGO</TableHead>
                  <TableHead>MÓDULOS PERMITIDOS</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-bold text-base">{role.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(!role.permissions || role.permissions.length === 0) && (
                          <span className="text-muted-foreground text-xs italic">Nenhum acesso</span>
                        )}
                        {role.permissions?.map((p: string) => {
                          const mod = AVAILABLE_MODULES.find(m => m.id === p);
                          return (
                            <Badge key={p} variant="outline" className="bg-muted/30 text-xs">
                              {mod ? mod.label : p}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(role)} className="hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id, role.name)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {roles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum cargo encontrado.</TableCell>
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
