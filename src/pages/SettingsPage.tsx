
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { DeploymentInfo } from "@/components/settings/DeploymentInfo";

const SettingsPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Configuración" 
        description="Gestión de preferencias del sistema y notificaciones"
      />
      
      <div className="space-y-8">
        <SettingsForm />
        <DeploymentInfo />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
