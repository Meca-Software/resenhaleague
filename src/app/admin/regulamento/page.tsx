import { getRegulations } from "@/app/actions/regulation-actions";
import RegulamentoAdminClient from "./client";

export const metadata = {
  title: "Admin - Regulamento",
};

export default async function AdminRegulamentoPage() {
  const initialRegulations = await getRegulations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight text-foreground">Regulamento</h1>
        <p className="text-muted-foreground font-exo2 mt-2">
          Gerencie os tópicos do regulamento oficial da liga.
        </p>
      </div>

      <RegulamentoAdminClient initialRegulations={initialRegulations || []} />
    </div>
  );
}
