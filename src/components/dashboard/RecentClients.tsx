
import { Client } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";

interface RecentClientsProps {
  clients: Client[];
}

export function RecentClients({ clients }: RecentClientsProps) {
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

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay clientes para mostrar
            </p>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
                    {client.name}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {client.email} · {client.phone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">{client.orders.length}</span>
                  </div>
                  <Badge variant="outline" className={getStatusClass(client.status)}>
                    {getStatusText(client.status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
          <div className="text-center mt-4">
            <Link
              to="/clients"
              className="text-primary text-sm hover:underline"
            >
              Ver todos los clientes
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
