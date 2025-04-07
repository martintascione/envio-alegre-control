
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { RefreshCw } from "lucide-react";

const ClientsPage = () => {
  const { refreshData, loading } = useApp();
  
  return (
    <MainLayout>
      <PageHeader 
        title="Clientes" 
        description="Gestión de clientes y sus pedidos"
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refreshData} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <NewClientDialog />
        </div>
      </PageHeader>
      
      <ClientsList />
    </MainLayout>
  );
};

export default ClientsPage;
