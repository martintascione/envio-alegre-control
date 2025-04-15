
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageX, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useWhatsAppSettings } from "@/contexts/useWhatsAppSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById, sendWhatsAppNotification, deleteOrder, refreshData, loading: appLoading } = useApp();
  const { whatsAppSettings } = useWhatsAppSettings();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderData, setOrderData] = useState<ReturnType<typeof getOrderById>>(undefined);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Cargar los datos del pedido cuando cambie el ID o se refresque
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        // Intentamos obtener el pedido
        const data = getOrderById(orderId);
        console.log(`Datos de pedido obtenidos:`, data);
        setOrderData(data);
        
        // Si el pedido no se encuentra, refrescar datos e intentar nuevamente (hasta 3 veces)
        if (!data && retryCount < 3) {
          console.log(`Intento ${retryCount + 1} de cargar pedido ${orderId}`);
          await refreshData();
          setRetryCount(prev => prev + 1);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al cargar el pedido:", error);
        setLoading(false);
      }
    };
    
    setLoading(true);
    fetchOrderData();
  }, [orderId, getOrderById, refreshData, retryCount]);
  
  // Mostrar estado de carga mientras se busca el pedido
  if (loading || (appLoading && retryCount < 3)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="mt-4 text-muted-foreground">
            {retryCount > 0 
              ? `Intentando cargar datos del pedido... (intento ${retryCount}/3)` 
              : 'Cargando información del pedido...'}
          </p>
        </div>
      </MainLayout>
    );
  }
  
  // Mostrar mensaje si no se encuentra el pedido
  if (!orderData || !orderId) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <PackageX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El pedido que estás buscando no existe o ha sido eliminado.
          </p>
          <Button onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Pedidos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { order, client } = orderData;

  // Verificar que el pedido tiene los datos mínimos necesarios
  if (!order || !order.id || !client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <PackageX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Datos de pedido incompletos</h2>
          <p className="text-muted-foreground mb-4">
            El pedido existe pero sus datos están incompletos.
          </p>
          <Button onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Pedidos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleDeleteOrder = () => {
    deleteOrder(order.id);
    navigate("/orders");
    toast.success("Pedido eliminado correctamente");
  };

  const handleSendManualNotification = async () => {
    setSending(true);
    
    if (!whatsAppSettings.notificationsEnabled) {
      toast.error("Notificaciones deshabilitadas", {
        description: "Las notificaciones están deshabilitadas. Habilítelas en la sección de Configuración",
      });
      setSending(false);
      return;
    }
    
    try {
      // Enviar la notificación manualmente usando los settings del contexto
      const result = await sendWhatsAppNotification(order, client);
      
      if (result) {
        toast.success("Notificación enviada correctamente", {
          description: `Se envió una notificación a ${client.name} (${client.phone})`,
        });
      } else {
        toast.error("Error al enviar la notificación", {
          description: "No se pudo enviar la notificación. Por favor intente nuevamente.",
        });
      }
    } catch (error) {
      console.error("Error al enviar notificación manual:", error);
      toast.error("Error al enviar notificación", {
        description: "Ha ocurrido un error al enviar la notificación. Intente nuevamente.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader title="Detalle de Pedido">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendManualNotification}
            disabled={sending}
          >
            <Send className="h-4 w-4 mr-2" /> 
            {sending ? "Enviando..." : "Enviar notificación"}
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente el pedido "{order.productDescription || 'Sin descripción'}" del cliente {client.name || 'desconocido'}.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>
      
      <div className="max-w-3xl mx-auto">
        <OrderDetails order={order} client={client} />
      </div>
    </MainLayout>
  );
};

export default OrderDetailPage;
