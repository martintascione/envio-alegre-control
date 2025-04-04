
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageX } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useApp();
  const navigate = useNavigate();
  
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

  return (
    <MainLayout>
      <PageHeader title="Detalle de Pedido">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
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
