
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import { getRegulations } from "@/app/actions/regulation-actions";

export default async function RegulamentoPage() {
  const regulations = await getRegulations();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 flex flex-col gap-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-orbitron tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> REGULAMENTO OFICIAL
          </h1>
          <p className="text-muted-foreground font-exo2 max-w-2xl">
            Regras de conduta, punições, sistema de pontuação e diretrizes do campeonato.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {regulations && regulations.length > 0 && regulations.map((reg) => (
          <Card key={reg.id} className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl text-primary">{reg.title}</CardTitle>
            </CardHeader>
            <CardContent className="font-exo2 text-muted-foreground space-y-4">
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: reg.content }} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
