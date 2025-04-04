
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ClientDetails } from "@/components/clients/ClientDetails";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { getClientById } = useApp();
  const navigate = useNavigate();
  
  const client = getClientById(clientId || "");
  
  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <UserX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cliente no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El cliente que estás buscando no existe o ha sido eliminado.
          </p>
          <Button onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Clientes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleDeleteClient = () => {
    toast.error("Funcionalidad no implementada", {
      description: "La eliminación de clientes estará disponible en una próxima versión",
    });
  };

  return (
    <MainLayout>
      <PageHeader title="Detalle de Cliente">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Button variant="destructive" onClick={handleDeleteClient}>
            Eliminar
          </Button>
        </div>
      </PageHeader>
      
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>
        
        <ClientDetails client={client} />
      </Tabs>
    </MainLayout>
  );
};

export default ClientDetailPage;
