
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useApp } from "@/contexts/AppContext";

const Index = () => {
  const { dashboardStats, clients } = useApp();
  
  // Obtener clientes ordenados por actualización reciente
  const recentClients = [...clients]
    .sort((a, b) => {
      // Obtener la fecha de actualización más reciente de todos los pedidos de cada cliente
      const latestUpdateA = a.orders.reduce((latest, order) => {
        const orderDate = new Date(order.updatedAt).getTime();
        return orderDate > latest ? orderDate : latest;
      }, 0);
      
      const latestUpdateB = b.orders.reduce((latest, order) => {
        const orderDate = new Date(order.updatedAt).getTime();
        return orderDate > latest ? orderDate : latest;
      }, 0);
      
      return latestUpdateB - latestUpdateA;
    })
    .slice(0, 5); // Limitar a 5 clientes

  return (
    <MainLayout>
      <PageHeader 
        title="Dashboard" 
        description="Resumen de pedidos y clientes activos"
      />
      
      <div className="space-y-6">
        <StatsCards stats={dashboardStats} />
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <RecentClients clients={recentClients} />
          <RecentActivity clients={clients} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
