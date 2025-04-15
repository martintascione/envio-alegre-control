
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ClientDetails } from "@/components/clients/ClientDetails";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { useState, useEffect } from "react";

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { getClientById, deleteClient, loading, refreshData } = useApp();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<ReturnType<typeof getClientById>>(undefined);
  const [retryCount, setRetryCount] = useState(0);
  
  // Cargar datos del cliente y reintentar si es necesario
  useEffect(() => {
    const loadClient = () => {
      if (!clientId) return;
      
      const currentClient = getClientById(clientId);
      setClient(currentClient);
      
      // Si el cliente no se encuentra y estamos en los primeros 3 intentos, intentar recargar
      if (!currentClient && retryCount < 3) {
        console.log(`Intento ${retryCount + 1} de cargar cliente ${clientId}`);
        setTimeout(() => {
          refreshData();
          setRetryCount(prev => prev + 1);
        }, 1000);
      } else {
        setIsLoading(false);
      }
    };
    
    loadClient();
  }, [clientId, getClientById, refreshData, retryCount]);
  
  // Mostrar un estado de carga mientras intentamos obtener el cliente
  if (loading || (isLoading && retryCount < 3)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cargando cliente...</h2>
          <p className="text-muted-foreground mb-4">
            {retryCount > 0 ? `Intentando cargar datos (intento ${retryCount}/3)` : 'Obteniendo información del cliente'}
          </p>
        </div>
      </MainLayout>
    );
  }
  
  // Si después de los intentos el cliente sigue sin encontrarse, mostrar error
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
    deleteClient(client.id);
    toast.success(`Cliente ${client.name} eliminado`, {
      description: "El cliente ha sido eliminado correctamente",
    });
    navigate("/clients");
  };

  return (
    <MainLayout>
      <PageHeader title="Detalle de Cliente">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
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
                  Esta acción eliminará permanentemente al cliente {client.name} y todos sus pedidos asociados.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>
      
      <ClientDetails client={client} />
    </MainLayout>
  );
};

export default ClientDetailPage;
