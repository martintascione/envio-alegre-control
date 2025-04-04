
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrdersList } from "@/components/orders/OrdersList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const OrdersPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Pedidos" 
        description="Gestión de todos los pedidos en el sistema"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Pedido
        </Button>
      </PageHeader>
      
      <OrdersList />
    </MainLayout>
  );
};

export default OrdersPage;
