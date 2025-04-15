
import { Order, Client, ShippingStatus } from "@/lib/types";
import { useState } from "react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/contexts/AppContext";
import { Package, Check, Clock, AlertTriangle, SendHorizontal } from "lucide-react";
import { shippingStatusMap } from "@/lib/data";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import config from "@/config";

interface OrderDetailsProps {
  order: Order;
  client: Client;
}

export function OrderDetails({ order, client }: OrderDetailsProps) {
  const { updateOrderStatus } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ShippingStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  // Helper function to check if a date string is valid
  const isValidDate = (dateString: string | undefined) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || !isValidDate(dateString)) {
      return "Fecha no disponible";
    }
    
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getNextStatus = (): ShippingStatus | null => {
    const statuses: ShippingStatus[] = [
      "purchased",
      "shipped_to_warehouse",
      "received_at_warehouse",
      "in_transit_to_argentina",
      "arrived_in_argentina"
    ];
    
    const currentIndex = statuses.indexOf(order.status);
    if (currentIndex < statuses.length - 1) {
      return statuses[currentIndex + 1];
    }
    return null;
  };

  const handleUpdateStatus = (status: ShippingStatus) => {
    setSelectedStatus(status);
    setOpenDialog(true);
  };

  const confirmUpdateStatus = async () => {
    if (selectedStatus) {
      try {
        setUpdating(true);
        
        // Intentar actualizar el estado
        await updateOrderStatus(order.id, selectedStatus);
        
        setOpenDialog(false);
        toast.success("Estado actualizado correctamente", {
          description: `El pedido ahora está en estado: ${shippingStatusMap[selectedStatus]}`
        });
      } catch (error) {
        console.error("Error al actualizar el estado:", error);
        toast.error("Error al actualizar el estado", {
          description: "Intenta nuevamente o actualiza la página"
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  // Función alternativa para abrir WhatsApp directamente
  const openWhatsAppDirectly = () => {
    try {
      // Limpia el número de teléfono
      const cleanPhone = client.phone.replace(/[\s+\-()]/g, '');
      
      // Crea un mensaje genérico sobre el estado actual
      const message = `Hola ${client.name}, tu pedido "${order.productDescription}" está en estado: ${shippingStatusMap[order.status]}`;
      
      // Abre WhatsApp con el mensaje
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      
      toast.success("WhatsApp abierto", {
        description: "Se ha abierto WhatsApp con un mensaje predeterminado"
      });
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      toast.error("Error al abrir WhatsApp", {
        description: "No se pudo abrir WhatsApp. Verifica la conexión."
      });
    }
  };

  // Asegurar que haya un historial de estados válido
  const safeStatusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  const nextStatus = getNextStatus();

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Package className="mr-2 h-5 w-5" /> 
                {order.productDescription || "Producto sin descripción"}
              </CardTitle>
              <CardDescription>
                {order.store || "Tienda no especificada"} 
                {order.trackingNumber ? `· Tracking: ${order.trackingNumber}` : ''}
              </CardDescription>
            </div>
            <OrderStatusBadge status={order.status} className="text-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Información del Cliente</h3>
              <div className="mt-2 text-sm">
                <div className="font-medium">{client.name || "Cliente sin nombre"}</div>
                <div className="text-muted-foreground">{client.email || "Sin email"}</div>
                <div className="text-muted-foreground">{client.phone || "Sin teléfono"}</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium">Historial de Estados</h3>
              {safeStatusHistory.length === 0 ? (
                <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm text-center">
                  No hay historial de estados disponible
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {safeStatusHistory.map((statusChange, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {statusChange.notificationSent ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {statusChange.status && shippingStatusMap[statusChange.status] 
                            ? shippingStatusMap[statusChange.status] 
                            : "Estado desconocido"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {statusChange.timestamp ? formatDate(statusChange.timestamp) : "Sin fecha"} 
                          {statusChange.notificationSent 
                            ? " · Notificación enviada" 
                            : " · Notificación pendiente"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <div className="text-sm text-muted-foreground">
            <span>Creado: {formatDate(order.createdAt)}</span>
            <span className="mx-2">·</span>
            <span>Actualizado: {formatDate(order.updatedAt)}</span>
          </div>
          
          <div className="flex gap-2">
            {nextStatus ? (
              <Button 
                className="flex-1" 
                onClick={() => handleUpdateStatus(nextStatus)}
              >
                <SendHorizontal className="mr-2 h-4 w-4" />
                Actualizar a: {shippingStatusMap[nextStatus]}
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                <Check className="mr-2 h-4 w-4" />
                Pedido completado
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={openWhatsAppDirectly}
            >
              Mensaje directo
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar actualización de estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas actualizar el estado del pedido?
              Se enviará una notificación automática por WhatsApp al cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <div className="flex items-center gap-3 bg-muted p-3 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="text-sm">
                <strong>Estado actual:</strong> {order.status && shippingStatusMap[order.status] || "Desconocido"}
                <br />
                <strong>Nuevo estado:</strong>{" "}
                {selectedStatus && shippingStatusMap[selectedStatus] || ""}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={confirmUpdateStatus}
              disabled={updating}
            >
              {updating ? (
                <>Actualizando...</>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Actualizar y notificar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
