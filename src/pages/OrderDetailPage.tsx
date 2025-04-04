
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageX, Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById, sendWhatsAppNotification } = useApp();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  
  const orderData = getOrderById(orderId || "");
  
  if (!orderData) {
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

  const handleDeleteOrder = () => {
    toast.error("Funcionalidad no implementada", {
      description: "La eliminación de pedidos estará disponible en una próxima versión",
    });
  };

  const handleSendManualNotification = async () => {
    setSending(true);
    
    // Obtener la configuración de WhatsApp directamente desde localStorage
    const whatsAppSettingsStr = localStorage.getItem('whatsappSettings');
    
    if (!whatsAppSettingsStr) {
      toast.error("Configuración de WhatsApp no encontrada", {
        description: "Por favor, configure primero las notificaciones de WhatsApp en la sección de Configuración",
      });
      setSending(false);
      return;
    }
    
    try {
      const settings = JSON.parse(whatsAppSettingsStr);
      
      if (!settings.notificationsEnabled) {
        toast.error("Notificaciones deshabilitadas", {
          description: "Las notificaciones están deshabilitadas. Habilítelas en la sección de Configuración",
        });
        setSending(false);
        return;
      }
      
      // Enviar la notificación manualmente
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
          <Button variant="destructive" onClick={handleDeleteOrder}>
            Eliminar
          </Button>
        </div>
      </PageHeader>
      
      <div className="max-w-3xl mx-auto">
        <OrderDetails order={order} client={client} />
      </div>
    </MainLayout>
  );
};

export default OrderDetailPage;
