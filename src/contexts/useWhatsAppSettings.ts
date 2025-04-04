
import { useState, useEffect } from 'react';
import { WhatsAppSettings } from './types';

export const useWhatsAppSettings = () => {
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings>({
    whatsappNumber: "+5491112345678",
    notificationsEnabled: true,
    autoNotify: true,
    apiKey: "",
    useWhatsAppAPI: false,
    provider: "direct",
    twilioAccountSid: "",
    twilioAuthToken: ""
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
          twilioAuthToken: settings.twilioAuthToken || ""
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
