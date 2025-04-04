
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ClientsPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Clientes" 
        description="Gestión de clientes y sus pedidos"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
        </Button>
      </PageHeader>
      
      <ClientsList />
    </MainLayout>
  );
};

export default ClientsPage;
