
import { useState, useEffect } from 'react';
import { WhatsAppSettings, MessageTemplate } from './types';
import { shippingStatusMap } from '@/lib/data';

// Plantillas predeterminadas para cada estado del pedido
const defaultTemplates: MessageTemplate[] = [
  {
    status: "purchased",
    template: "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido comprado.\n\n_Servicio de notificación automática._",
    enabled: true
  },
  {
    status: "shipped_to_warehouse",
    template: "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido fue enviado por el Comercio.\n\n🚚 Fecha estimada de entrega en Miami: [fecha].\n\n_Servicio de notificación automática._",
    enabled: true
  },
  {
    status: "received_at_warehouse",
    template: "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido recibido en nuestro almacén en Miami.\n\n📆 Próximamente será enviado a Argentina.\n\n_Servicio de notificación automática._",
    enabled: true
  },
  {
    status: "in_transit_to_argentina",
    template: "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido está en tránsito hacia Argentina.\n\n🚢 Fecha estimada de llegada: [fecha].\n\n_Servicio de notificación automática._",
    enabled: true
  },
  {
    status: "arrived_in_argentina",
    template: "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ ¡Tu pedido ha llegado a Argentina!\n\n📞 Nos contactaremos para coordinar la entrega.\n\n_Servicio de notificación automática._",
    enabled: true
  }
];

export const useWhatsAppSettings = () => {
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings>({
    whatsappNumber: "+5491112345678",
    notificationsEnabled: true,
    autoNotify: true,
    apiKey: "",
    useWhatsAppAPI: false,
    provider: "direct",
    twilioAccountSid: "",
    twilioAuthToken: "",
    messageTemplates: defaultTemplates
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('whatsappSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as WhatsAppSettings;
        // Asegurar compatibilidad con versiones anteriores que no tenían los nuevos campos
        setWhatsAppSettings({
          ...whatsAppSettings,
          ...settings,
          apiKey: settings.apiKey || "",
          useWhatsAppAPI: settings.useWhatsAppAPI || false,
          provider: settings.provider || "direct",
          twilioAccountSid: settings.twilioAccountSid || "",
          twilioAuthToken: settings.twilioAuthToken || "",
          messageTemplates: settings.messageTemplates || defaultTemplates
        });
      } catch (error) {
        console.error("Error parsing saved WhatsApp settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateWhatsAppSettings = (newSettings: WhatsAppSettings) => {
    setWhatsAppSettings(newSettings);
    localStorage.setItem('whatsappSettings', JSON.stringify(newSettings));
  };

  return { whatsAppSettings, setWhatsAppSettings: updateWhatsAppSettings };
};
