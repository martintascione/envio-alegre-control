
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

export function SettingsForm() {
  const [whatsappNumber, setWhatsappNumber] = useState("+5491112345678");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoNotify, setAutoNotify] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular la guardado
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Configuración guardada correctamente");
    }, 1000);
  };

  return (
    <form onSubmit={handleSaveSettings}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Configure las preferencias de la aplicación y las notificaciones automáticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Configuración general</h3>
              <p className="text-sm text-muted-foreground">
                Ajuste la configuración general de la aplicación
              </p>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificaciones</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar o deshabilitar todas las notificaciones
                  </p>
                </div>
                <Switch 
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Configuración de WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Configure la integración con WhatsApp para las notificaciones automáticas
              </p>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="whatsappNumber">Número de WhatsApp para envío de notificaciones</Label>
                <Input 
                  id="whatsappNumber"
                  placeholder="+5491112345678" 
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Ingrese el número de WhatsApp que utilizará para enviar las notificaciones a los clientes
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoNotify">Notificaciones automáticas</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones automáticamente cuando cambie el estado de un pedido
                  </p>
                </div>
                <Switch 
                  id="autoNotify"
                  checked={autoNotify}
                  onCheckedChange={setAutoNotify}
                  disabled={!notificationsEnabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="ml-auto" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
