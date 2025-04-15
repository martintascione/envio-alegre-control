
import { Client } from "@/lib/types";
import { OrderStatusBadge } from "../orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

interface ClientDetailsProps {
  client: Client;
}

export function ClientDetails({ client }: ClientDetailsProps) {
  // Asegurar que siempre tengamos un array de órdenes
  const orders = Array.isArray(client.orders) ? client.orders : [];
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "finished":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "pending":
        return "Pendiente";
      case "finished":
        return "Finalizado";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Ordenar pedidos por fecha de actualización (más reciente primero)
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1" />
                  {client.email}
                </div>
                <div className="flex items-center text-muted-foreground sm:ml-4">
                  <Phone className="h-4 w-4 mr-1" />
                  {client.phone}
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusClass(client.status)} text-sm px-3 py-1`}
            >
              {getStatusText(client.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-medium mb-3">Resumen</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Total de pedidos</div>
              <div className="text-2xl font-bold mt-1">{orders.length}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Pedidos completados</div>
              <div className="text-2xl font-bold mt-1">
                {orders.filter(order => order.status === "arrived_in_argentina").length}
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Pedidos en proceso</div>
              <div className="text-2xl font-bold mt-1">
                {orders.filter(order => order.status !== "arrived_in_argentina").length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedOrders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Este cliente no tiene pedidos
            </div>
          ) : (
            <div className="space-y-4">
              {sortedOrders.map(order => (
                <div 
                  key={order.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="font-medium flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      {order.productDescription}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.store} 
                      {order.trackingNumber ? ` · Tracking: ${order.trackingNumber}` : ''}
                      <div className="mt-1">
                        Actualizado: {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-3 mt-3 sm:mt-0">
                    <OrderStatusBadge status={order.status} />
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
