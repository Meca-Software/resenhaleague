"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, Loader2, Image as ImageIcon, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function PortalProfilePage() {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [nationality, setNationality] = useState("");
  const [countries, setCountries] = useState<{code: string, name: string, flag: string}[]>([]);
  const [bio, setBio] = useState("");
  const [pilotId, setPilotId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load session from Supabase Auth
  useEffect(() => {
    const fetchProfile = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      const userId = session?.user?.id;
      if (!userId) return;
      
      setPilotId(userId);

      const { data: userData } = await supabase
        .from('system_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData) {
        setAvatarUrl(userData.avatar_url || null);
        setBannerUrl(userData.banner_url || null);
        setDisplayName(userData.full_name || userData.username || "");
        setNationality(userData.nationality || "");
        setBio(userData.description || "");
      }
    };
    
    const loadCountries = async () => {
      try {
        const res = await fetch("https://flagcdn.com/pt/codes.json");
        const data = await res.json();
        const formatted = Object.entries(data).map(([code, name]) => {
          const upperCode = code.toUpperCase();
          const flagEmoji = upperCode.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
          return {
            code: upperCode,
            name: name as string,
            flag: flagEmoji
          };
        });
        setCountries(formatted);
      } catch (e) {
        setCountries([
          { code: "BR", name: "Brasil", flag: "🇧🇷" },
          { code: "PT", name: "Portugal", flag: "🇵🇹" },
          { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
        ]);
      }
    };

    fetchProfile();
    loadCountries();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!pilotId) {
      toast.error("Você não está logado.");
      return;
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${pilotId}-${type}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingBanner(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        localStorage.setItem("user_avatar", publicUrl);
        await supabase.from('system_users').update({ avatar_url: publicUrl }).eq('id', pilotId);
      } else {
        setBannerUrl(publicUrl);
        await supabase.from('system_users').update({ banner_url: publicUrl }).eq('id', pilotId);
      }
      
      toast.success(`Upload de ${type} concluído e salvo no perfil!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem.');
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingBanner(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!pilotId) {
      toast.error("Você não está logado.");
      return;
    }

    setIsSaving(true);
    
    const payload = {
      full_name: displayName,
      nationality: nationality,
      description: bio,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
    };

    try {
      const { error } = await supabase.from('system_users').update(payload).eq('id', pilotId);
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      if (avatarUrl) {
        localStorage.setItem("user_avatar", avatarUrl);
      }
      
      toast.success("Perfil salvo com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabaseClient = createClient();
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error("Erro ao alterar senha. Talvez você precise fazer login novamente.");
        setIsChangingPassword(false);
        return;
      }

      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Erro interno ao alterar senha.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight">MEU PERFIL</h1>
        <p className="text-muted-foreground font-exo2 mt-1">Gerencie suas informações públicas e aparência na liga.</p>
      </div>

      <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
        <CardHeader className="border-b border-border/40 pb-6">
          <CardTitle className="font-orbitron text-xl">Aparência do Perfil</CardTitle>
          <CardDescription className="font-exo2">Essas imagens aparecerão no seu Perfil Público e nas transmissões oficiais.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={(e) => handleFileUpload(e, 'avatar')} 
            className="hidden" 
            accept="image/*"
          />
          <input 
            type="file" 
            ref={bannerInputRef} 
            onChange={(e) => handleFileUpload(e, 'banner')} 
            className="hidden" 
            accept="image/*"
          />

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-xl relative group">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-4xl font-rajdhani font-bold bg-muted text-muted-foreground transition-all group-hover:blur-sm">PL</AvatarFallback>
              <div 
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                onClick={() => avatarInputRef.current?.click()}
              >
                {isUploadingAvatar ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Upload className="w-8 h-8 text-white" />}
              </div>
            </Avatar>
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <h3 className="font-rajdhani font-bold text-lg">Foto de Perfil</h3>
                <p className="text-sm text-muted-foreground font-exo2">Recomendado: Imagem quadrada (1:1), tamanho máximo de 2MB.</p>
              </div>
              <div className="flex gap-3 justify-center sm:justify-start">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-exo2 border-primary/50 hover:bg-primary/10 transition-colors"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
                  {isUploadingAvatar ? 'Enviando...' : 'Fazer Upload'}
                </Button>
                <Button variant="ghost" size="sm" className="font-exo2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setAvatarUrl(null)} disabled={!avatarUrl || isUploadingAvatar}>
                  Remover Foto
                </Button>
              </div>
            </div>
          </div>

          <hr className="my-6 border-border/40" />

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div 
              className="w-full sm:w-56 h-28 bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center relative group hover:border-primary transition-colors overflow-hidden"
              style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
               <div 
                 className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                 onClick={() => bannerInputRef.current?.click()}
               >
                 {isUploadingBanner ? <Loader2 className="w-6 h-6 text-white mb-1 animate-spin" /> : <Upload className="w-6 h-6 text-white mb-1" />}
               </div>
               {!bannerUrl && (
                 <div className="text-muted-foreground group-hover:opacity-0 transition-opacity flex flex-col items-center">
                   <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                   <span className="text-xs font-rajdhani font-bold uppercase tracking-wider">Banner Padrão</span>
                 </div>
               )}
            </div>
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <h3 className="font-rajdhani font-bold text-lg">Banner do Perfil</h3>
                <p className="text-sm text-muted-foreground font-exo2">Recomendado: Imagem larga (ex: 1200x400px), tamanho máximo de 5MB. Ele será exibido no topo do seu Perfil Público.</p>
              </div>
              <div className="flex gap-3 justify-center sm:justify-start">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-exo2 border-primary/50 hover:bg-primary/10 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  {isUploadingBanner ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
                  {isUploadingBanner ? 'Enviando...' : 'Alterar Banner'}
                </Button>
                <Button variant="ghost" size="sm" className="font-exo2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setBannerUrl(null)} disabled={!bannerUrl || isUploadingBanner}>
                  Remover Banner
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
        <CardHeader className="border-b border-border/40 pb-6">
          <CardTitle className="font-orbitron text-xl">Informações Públicas</CardTitle>
          <CardDescription className="font-exo2">Detalhes que serão exibidos no seu Card de Piloto (Estilo Steam).</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                Nome de Exibição
              </Label>
              <Input 
                id="display_name" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como você quer ser chamado" 
                className="font-exo2 bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality" className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                Nacionalidade
              </Label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="flex h-11 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 font-exo2"
              >
                <option value="">Selecione sua bandeira...</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                Biografia / Descrição
              </Label>
              <Textarea 
                id="bio" 
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Sempre em busca da volta perfeita..." 
                className="font-exo2 bg-background/50 border-border/50 resize-none focus-visible:ring-primary/50 text-base" 
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground font-exo2">Uma breve descrição sobre seu estilo de pilotagem ou história na liga.</p>
                <p className="text-xs text-muted-foreground font-exo2 font-bold">{bio.length}/300</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t border-border/40 py-4 px-6 flex justify-end gap-4">
          <Button variant="ghost" className="font-exo2">Descartar Alterações</Button>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="font-rajdhani font-bold text-base px-8 tracking-wide shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
            {isSaving ? "SALVANDO..." : "SALVAR PERFIL"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-card/40 border-border/50 backdrop-blur-md shadow-lg">
        <CardHeader className="border-b border-border/40 pb-6">
          <CardTitle className="font-orbitron text-xl flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Segurança da Conta
          </CardTitle>
          <CardDescription className="font-exo2">Altere sua senha de acesso ao sistema.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                Senha Atual
              </Label>
              <Input 
                id="current_password" 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual" 
                className="font-exo2 bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password" className="font-rajdhani font-bold text-sm text-foreground uppercase tracking-wider">
                Nova Senha
              </Label>
              <Input 
                id="new_password" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha" 
                className="font-exo2 bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11" 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t border-border/40 py-4 px-6 flex justify-end gap-4">
          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword || !currentPassword || !newPassword} 
            className="font-rajdhani font-bold text-base px-8 tracking-wide shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
            {isChangingPassword ? "ALTERANDO..." : "ALTERAR SENHA"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
