
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const orderSchema = z.object({
  clientId: z.string({
    required_error: "Por favor seleccione un cliente",
  }),
  productDescription: z.string().min(5, { 
    message: "La descripción debe tener al menos 5 caracteres" 
  }),
  store: z.string().min(2, { 
    message: "La tienda debe tener al menos 2 caracteres" 
  }),
  trackingNumber: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function NewOrderDialog() {
  const { clients, addOrder } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: "",
      productDescription: "",
      store: "",
      trackingNumber: "",
    },
  });

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setIsSubmitting(true);
      // Asegurarse de que todos los campos requeridos estén presentes
      if (!data.clientId || !data.productDescription || !data.store) {
        toast.error("Por favor complete todos los campos requeridos");
        setIsSubmitting(false);
        return;
      }
      
      // Llama a la función addOrder con los datos validados
      await addOrder({
        clientId: data.clientId,
        productDescription: data.productDescription,
        store: data.store,
        trackingNumber: data.trackingNumber || ""
      });
      
      toast.success("Pedido creado correctamente");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      toast.error("Error al crear el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar solo clientes activos o pendientes
  const availableClients = clients.filter(client => 
    client.status === "active" || client.status === "pending"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo pedido. Haga clic en guardar cuando termine.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableClients.length === 0 ? (
                        <SelectItem value="no-clients" disabled>
                          No hay clientes disponibles
                        </SelectItem>
                      ) : (
                        availableClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: iPhone 15 Pro Max 256GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="store"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Amazon, Apple Store" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de seguimiento (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: USPS1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Pedido"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
