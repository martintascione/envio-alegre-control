
import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrdersList } from "@/components/orders/OrdersList";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { RefreshCw } from "lucide-react";

const OrdersPage = () => {
  const { refreshData, loading } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  return (
    <MainLayout>
      <PageHeader 
        title="Pedidos" 
        description="Gestión de todos los pedidos en el sistema"
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <NewOrderDialog />
        </div>
      </PageHeader>
      
      <OrdersList />
    </MainLayout>
  );
};

export default OrdersPage;
