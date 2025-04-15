
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Client } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export function ClientsList() {
  const { clients, loading, filterClients } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [displayedClients, setDisplayedClients] = useState<Client[]>([]);
  
  // Procesar clientes cuando cambien o se apliquen filtros
  useEffect(() => {
    console.log("Procesando lista de clientes:", clients.length, "clientes");
    
    // Verificamos que tenemos resultados válidos y filtramos clientes vacíos
    const filtered = filterClients(
      statusFilter === "all" ? undefined : statusFilter, 
      searchTerm
    ).filter(client => 
      // Filtramos los clientes que tienen datos vacíos o nulos
      client && client.id && client.name && client.name !== "Cliente sin nombre" && 
      client.email && client.email !== "Sin email" && client.phone && client.phone !== "Sin teléfono"
    );
    
    // Asegurarnos de que estamos procesando un array
    const safeFilteredClients = Array.isArray(filtered) ? filtered : [];
    
    // Validar que todos los clientes tienen datos básicos
    const validClients = safeFilteredClients.map(client => ({
      ...client,
      id: client.id || `temp-${Date.now()}`,
      name: client.name || "Cliente sin nombre",
      email: client.email || "Sin email",
      phone: client.phone || "Sin teléfono",
      status: client.status || "pending",
      orders: Array.isArray(client.orders) ? client.orders : []
    }));
    
    // Ordenar por cantidad de pedidos (descendente)
    const sortedClients = [...validClients].sort(
      (a, b) => b.orders.length - a.orders.length
    );
    
    setDisplayedClients(sortedClients);
    
    console.log("Lista de clientes procesada:", sortedClients.length, "clientes válidos");
  }, [clients, filterClients, searchTerm, statusFilter]);

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
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
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="finished">Finalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                    <p className="text-muted-foreground">Cargando clientes...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              displayedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{Array.isArray(client.orders) ? client.orders.length : 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getStatusClass(client.status)}
                    >
                      {getStatusText(client.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/clients/${client.id}`}>
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
