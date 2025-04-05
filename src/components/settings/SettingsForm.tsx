
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useWhatsAppSettings } from "@/contexts/useWhatsAppSettings";
import { Textarea } from "@/components/ui/textarea";
import { MessageTemplate } from "@/contexts/types";
import { shippingStatusMap } from "@/lib/data";

export function SettingsForm() {
  const { whatsAppSettings, setWhatsAppSettings } = useWhatsAppSettings();
  const [whatsappNumber, setWhatsappNumber] = useState(whatsAppSettings.whatsappNumber);
  const [notificationsEnabled, setNotificationsEnabled] = useState(whatsAppSettings.notificationsEnabled);
  const [autoNotify, setAutoNotify] = useState(whatsAppSettings.autoNotify);
  const [useWhatsAppAPI, setUseWhatsAppAPI] = useState(whatsAppSettings.useWhatsAppAPI || false);
  const [apiKey, setApiKey] = useState(whatsAppSettings.apiKey || "");
  const [provider, setProvider] = useState(whatsAppSettings.provider || "direct");
  const [twilioAccountSid, setTwilioAccountSid] = useState(whatsAppSettings.twilioAccountSid || "");
  const [twilioAuthToken, setTwilioAuthToken] = useState(whatsAppSettings.twilioAuthToken || "");
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(
    whatsAppSettings.messageTemplates || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Update local state when settings from context change
  useEffect(() => {
    setWhatsappNumber(whatsAppSettings.whatsappNumber);
    setNotificationsEnabled(whatsAppSettings.notificationsEnabled);
    setAutoNotify(whatsAppSettings.autoNotify);
    setUseWhatsAppAPI(whatsAppSettings.useWhatsAppAPI || false);
    setApiKey(whatsAppSettings.apiKey || "");
    setProvider(whatsAppSettings.provider || "direct");
    setTwilioAccountSid(whatsAppSettings.twilioAccountSid || "");
    setTwilioAuthToken(whatsAppSettings.twilioAuthToken || "");
    setMessageTemplates(whatsAppSettings.messageTemplates || []);
  }, [whatsAppSettings]);

  const handleUpdateTemplate = (status: string, template: string, enabled: boolean) => {
    const updatedTemplates = messageTemplates.map(t => {
      if (t.status === status) {
        return { ...t, template, enabled };
      }
      return t;
    });
    setMessageTemplates(updatedTemplates);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate WhatsApp number
    const isValidNumber = /^\+[0-9]{10,15}$/.test(whatsappNumber);
    
    if (!isValidNumber) {
      toast.error("Número de WhatsApp inválido", {
        description: "Por favor ingrese un número válido con código de país (ej: +5491123456789)"
      });
      setIsLoading(false);
      return;
    }
    
    // Validate API Key if WhatsApp API is enabled
    if (useWhatsAppAPI && provider === "direct" && !apiKey.trim()) {
      toast.error("API Key de WhatsApp requerida", {
        description: "Por favor ingrese la API Key de WhatsApp Business"
      });
      setIsLoading(false);
      return;
    }

    // Validate Twilio credentials if Twilio is selected
    if (provider === "twilio" && (!twilioAccountSid.trim() || !twilioAuthToken.trim())) {
      toast.error("Credenciales de Twilio requeridas", {
        description: "Por favor ingrese el Account SID y Auth Token de Twilio"
      });
      setIsLoading(false);
      return;
    }
    
    // Save settings using the context hook
    const newSettings = {
      whatsappNumber,
      notificationsEnabled,
      autoNotify,
      useWhatsAppAPI,
      apiKey,
      provider,
      twilioAccountSid,
      twilioAuthToken,
      messageTemplates
    };
    
    setWhatsAppSettings(newSettings);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Configuración guardada correctamente", {
        description: "Las notificaciones de WhatsApp han sido configuradas."
      });
    }, 500);
  };

  return (
    <form onSubmit={handleSaveSettings}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Configure las preferencias de la aplicación y las notificaciones automáticas
          </CardDescription>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="templates">Plantillas de Mensajes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-6">
          <TabsContent value="general" className="space-y-6">
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
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useWhatsAppAPI">Usar API para envío de mensajes</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar una API para envío programático de mensajes de WhatsApp
                    </p>
                  </div>
                  <Switch 
                    id="useWhatsAppAPI"
                    checked={useWhatsAppAPI}
                    onCheckedChange={setUseWhatsAppAPI}
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                {useWhatsAppAPI && (
                  <div className="space-y-4 border p-4 rounded-md">
                    <div>
                      <Label className="mb-2 block">Proveedor de API</Label>
                      <RadioGroup 
                        value={provider} 
                        onValueChange={(value) => setProvider(value as "direct" | "twilio")}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="direct" id="direct" />
                          <Label htmlFor="direct">WhatsApp Business API (directo)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="twilio" id="twilio" />
                          <Label htmlFor="twilio">Twilio</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {provider === "direct" && (
                      <div className="grid gap-2">
                        <Label htmlFor="apiKey">API Key de WhatsApp Business</Label>
                        <Input 
                          id="apiKey"
                          type="password"
                          placeholder="Ingrese su API Key de WhatsApp Business" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          La API Key se obtiene desde el panel de desarrollador de WhatsApp Business
                        </p>
                      </div>
                    )}
                    
                    {provider === "twilio" && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                          <Input 
                            id="twilioAccountSid"
                            type="text"
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                            value={twilioAccountSid}
                            onChange={(e) => setTwilioAccountSid(e.target.value)}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
                          <Input 
                            id="twilioAuthToken"
                            type="password"
                            placeholder="Ingrese su Auth Token de Twilio" 
                            value={twilioAuthToken}
                            onChange={(e) => setTwilioAuthToken(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Estas credenciales se obtienen desde el panel de control de Twilio
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Plantillas de mensajes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure las plantillas para los mensajes de cada estado del pedido
              </p>
              
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
                  <p className="font-medium text-amber-800">Variables disponibles:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-700">
                    <li><code>[cliente]</code> - Nombre del cliente</li>
                    <li><code>[comercio]</code> - Nombre de la tienda</li>
                    <li><code>[pedido]</code> - Descripción del producto</li>
                    <li><code>[fecha]</code> - Fecha estimada de entrega</li>
                    <li><code>[tracking]</code> - Número de seguimiento</li>
                  </ul>
                </div>
                
                {messageTemplates.map((template) => (
                  <div key={template.status} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{shippingStatusMap[template.status]}</h4>
                      <Switch 
                        checked={template.enabled} 
                        onCheckedChange={(checked) => {
                          handleUpdateTemplate(template.status, template.template, checked);
                        }}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                    
                    <Textarea 
                      value={template.template} 
                      onChange={(e) => {
                        handleUpdateTemplate(template.status, e.target.value, template.enabled);
                      }}
                      placeholder="Escriba el mensaje para este estado..."
                      rows={6}
                      className="font-mono text-sm"
                      disabled={!notificationsEnabled || !template.enabled}
                    />
                    
                    {template.enabled && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Vista previa:</p>
                        <p className="text-sm whitespace-pre-line">
                          {template.template
                            .replace(/\[cliente\]/g, "Juan Pérez")
                            .replace(/\[comercio\]/g, "Amazon")
                            .replace(/\[pedido\]/g, "Smartphone Galaxy S22")
                            .replace(/\[fecha\]/g, "15 de mayo de 2025")
                            .replace(/\[tracking\]/g, "TRK123456789")}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
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
