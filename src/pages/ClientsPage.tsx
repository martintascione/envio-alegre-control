
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { NewClientDialog } from "@/components/clients/NewClientDialog";

const ClientsPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Clientes" 
        description="Gestión de clientes y sus pedidos"
      >
        <NewClientDialog />
      </PageHeader>
      
      <ClientsList />
    </MainLayout>
  );
};

export default ClientsPage;
