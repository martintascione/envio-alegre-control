
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
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import config from "@/config";

const clientSchema = z.object({
  name: z.string().min(2, { 
    message: "El nombre debe tener al menos 2 caracteres" 
  }),
  email: z.string().email({ 
    message: "Por favor ingrese un email válido" 
  }),
  phone: z.string().min(5, { 
    message: "El teléfono debe tener al menos 5 caracteres" 
  }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function NewClientDialog() {
  const { addClient, refreshData } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      
      // Call addClient and wait for result
      const result = await addClient({
        name: data.name,
        email: data.email,
        phone: data.phone
      });
      
      console.log("Cliente creado con éxito:", result);
      
      // Close dialog and reset form after successful submission
      setOpen(false);
      form.reset();
      
      // Notificar al usuario
      toast.success("Cliente creado con éxito", {
        description: "El cliente ha sido añadido al sistema"
      });
      
      // Refresh data to ensure we have the latest from the server
      setTimeout(() => refreshData(), 1000);
      
    } catch (error) {
      console.error("Error al crear el cliente:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Error al conectar con el servidor";
      
      setServerError(errorMessage);
      
      toast.error("Error al crear el cliente", {
        description: `${errorMessage}${config.isDevelopmentMode ? " (Usando modo de desarrollo)" : ""}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo cliente. Haga clic en guardar cuando termine.
          </DialogDescription>
        </DialogHeader>
        
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {serverError}
              {config.isDevelopmentMode && (
                <div className="mt-1 text-xs opacity-80">
                  Modo de desarrollo activo: Los datos se guardarán localmente.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+54 9 11 1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
