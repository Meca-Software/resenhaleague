"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Shield, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { createSystemUser, deleteSystemUser } from "@/app/actions/auth-actions";
import { toast } from "sonner";

export default function AdminContasPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("pilot");

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data: usersData, error } = await supabase
      .from("system_users")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });
      
    const { data: rolesData } = await supabase.from('roles').select('*').order('name');
    
    if (usersData) setUsers(usersData);
    if (rolesData) setRolesList(rolesData);
    
    if (rolesData && rolesData.length > 0 && role === 'pilot') {
      const defaultRole = rolesData.find(r => r.name === 'Piloto') || rolesData[0];
      setRole(defaultRole.id);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!email || !username || !password) return toast.error("Preencha todos os campos!");
    setIsCreating(false);
    
    // Convert role_id to role name for the new action logic, mapping to English enum values
    const rawRoleName = rolesList.find(r => r.id === role)?.name?.toLowerCase() || 'pilot';
    
    let roleEnum = 'user';
    if (rawRoleName.includes('super')) roleEnum = 'superadmin';
    else if (rawRoleName.includes('admin')) roleEnum = 'admin';
    else if (rawRoleName.includes('comissário') || rawRoleName.includes('steward')) roleEnum = 'steward';
    else if (rawRoleName.includes('piloto') || rawRoleName.includes('pilot')) roleEnum = 'pilot';
    else if (rawRoleName.includes('moderador') || rawRoleName.includes('moderator')) roleEnum = 'moderator';

    const result = await createSystemUser({
      email,
      username,
      password_hash: password,
      role_id: role,
      role: roleEnum
    });

    if (!result.success) {
      toast.error("Erro ao criar usuário: " + result.error);
    } else {
      setEmail("");
      setUsername("");
      setPassword("");
      fetchUsers(); // Refresh
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este usuário?")) {
      const result = await deleteSystemUser(id);
      if (result.success) fetchUsers();
      else toast.error("Erro ao deletar: " + result.error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> GESTÃO DE CONTAS E CARGOS
          </h1>
          <p className="text-muted-foreground font-exo2 mt-1">
            Crie novos usuários, defina níveis de permissão (RBAC) e gerencie acessos ao sistema.
          </p>
        </div>
        <Button className="font-rajdhani font-bold" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" /> CRIAR NOVA CONTA
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Registrar Novo Usuário</CardTitle>
            <CardDescription className="font-exo2">Este usuário poderá acessar o painel correspondente ao seu cargo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 font-exo2">
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">E-mail</label>
                <Input 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@exemplo.com" className="bg-background/50 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Username</label>
                <Input 
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: joao.f1" className="bg-background/50 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Senha Provisória</label>
                <Input 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••" type="password" className="bg-background/50 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-rajdhani uppercase font-bold text-muted-foreground">Cargo (Role)</label>
                <select 
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="font-rajdhani">CANCELAR</Button>
              <Button onClick={handleCreateUser} className="font-rajdhani font-bold bg-green-600 hover:bg-green-700">SALVAR E CRIAR CONTA</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando contas do Supabase...</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 font-rajdhani">
                <TableRow>
                  <TableHead>USERNAME</TableHead>
                  <TableHead>E-MAIL</TableHead>
                  <TableHead className="text-center">CARGO (ROLE)</TableHead>
                  <TableHead className="text-center">DATA CRIAÇÃO</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-exo2">
                {users.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-bold flex items-center gap-2">
                      {account.role === "superadmin" && <Shield className="w-4 h-4 text-primary" />}
                      {account.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{account.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={
                        account.roles?.name === "Superadmin" ? "text-primary border-primary bg-primary/10" : 
                        "text-muted-foreground border-border bg-muted/10"
                      }>
                        {account.roles?.name?.toUpperCase() || account.role?.toUpperCase() || 'DESCONHECIDO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {new Date(account.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></Button>
                      {account.role !== "superadmin" && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(account.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
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
