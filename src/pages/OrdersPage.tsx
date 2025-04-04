
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrdersList } from "@/components/orders/OrdersList";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";

const OrdersPage = () => {
  return (
    <MainLayout>
      <PageHeader 
        title="Pedidos" 
        description="Gestión de todos los pedidos en el sistema"
      >
        <NewOrderDialog />
      </PageHeader>
      
      <OrdersList />
    </MainLayout>
  );
};

export default OrdersPage;
