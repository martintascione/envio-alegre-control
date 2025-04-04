
import { Client, Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { shippingStatusMap } from "@/lib/data";
import { Link } from "react-router-dom";

interface RecentActivityProps {
  clients: Client[];
}

export function RecentActivity({ clients }: RecentActivityProps) {
  // Obtener las últimas actualizaciones de pedidos
  const getRecentActivity = () => {
    const allOrders: Array<{order: Order, client: Client}> = [];
    
    clients.forEach(client => {
      client.orders.forEach(order => {
        if (order.statusHistory.length > 0) {
          allOrders.push({ order, client });
        }
      });
    });
    
    // Ordenar por fecha de actualización (descendente)
    return allOrders
      .sort((a, b) => 
        new Date(b.order.updatedAt).getTime() - new Date(a.order.updatedAt).getTime()
      )
      .slice(0, 5); // Tomar los 5 más recientes
  };
  
  const recentActivity = getRecentActivity();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas actualizaciones de pedidos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay actividad reciente
            </p>
          ) : (
            recentActivity.map(({ order, client }) => (
              <div key={order.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="font-medium">
                  <Link to={`/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-muted-foreground">
                    {order.productDescription} - 
                  </span>{" "}
                  <span className="font-medium">
                    {shippingStatusMap[order.status]}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(order.updatedAt)}
                </div>
              </div>
            ))
          )}
          <div className="text-center mt-4">
            <Link
              to="/orders"
              className="text-primary text-sm hover:underline"
            >
              Ver todos los pedidos
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
