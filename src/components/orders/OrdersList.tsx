
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { ShippingStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package } from "lucide-react";
import { Link } from "react-router-dom";

export function OrdersList() {
  const { clients } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Helper function to check if a date string is valid - moved to the top
  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    // Check if the date string is valid before formatting
    if (!isValidDate(dateString)) {
      console.error("Invalid date:", dateString);
      return "Fecha inválida";
    }
    
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateString));
  };
  
  // Verificar que clients es un array
  const safeClients = Array.isArray(clients) ? clients : [];
  
  // Asegúrate de que cada cliente tiene un array de orders
  const validClients = safeClients.map(client => ({
    ...client,
    orders: Array.isArray(client.orders) ? client.orders : []
  }));
  
  const allOrders = validClients.flatMap(client => 
    client.orders.map(order => ({
      ...order,
      clientName: client.name,
      clientId: client.id
    }))
  );
  
  const filteredOrders = allOrders.filter(order => {
    // Filtrar por estado
    if (statusFilter !== "all") {
      if (order.status !== statusFilter) {
        return false;
      }
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.productDescription.toLowerCase().includes(term) ||
        order.store.toLowerCase().includes(term) ||
        order.clientName.toLowerCase().includes(term) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(term))
      );
    }
    
    return true;
  });
  
  // Ordenar por fecha de actualización (más reciente primero)
  const sortedOrders = filteredOrders.sort((a, b) => {
    // Ensure we have valid dates before sorting
    const dateA = isValidDate(a.updatedAt) ? new Date(a.updatedAt).getTime() : 0;
    const dateB = isValidDate(b.updatedAt) ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="purchased">Compra realizada</SelectItem>
            <SelectItem value="shipped_to_warehouse">Enviado a depósito</SelectItem>
            <SelectItem value="received_at_warehouse">Recibido en depósito</SelectItem>
            <SelectItem value="in_transit_to_argentina">En viaje a Argentina</SelectItem>
            <SelectItem value="arrived_in_argentina">Llegado a Argentina</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {order.productDescription}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link to={`/clients/${order.clientId}`} className="hover:underline">
                      {order.clientName}
                    </Link>
                  </TableCell>
                  <TableCell>{order.store}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status as ShippingStatus} />
                  </TableCell>
                  <TableCell>{formatDate(order.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
