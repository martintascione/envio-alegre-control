
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { DeploymentInfo } from "@/components/settings/DeploymentInfo";
import { MessageSquare } from "lucide-react";

const SettingsPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Configuración" 
        description="Gestión de preferencias del sistema y notificaciones"
      >
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            Incluye configuración de plantillas para mensajes de WhatsApp
          </span>
        </div>
      </PageHeader>
      
      <div className="space-y-8">
        <SettingsForm />
        <DeploymentInfo />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
