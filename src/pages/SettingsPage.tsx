
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";

const SettingsPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Configuración" 
        description="Gestión de preferencias del sistema y notificaciones"
      />
      
      <SettingsForm />
    </MainLayout>
  );
};

export default SettingsPage;
