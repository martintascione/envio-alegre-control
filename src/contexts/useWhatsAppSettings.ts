
import { useState, useEffect } from 'react';
import { WhatsAppSettings } from './types';

export const useWhatsAppSettings = () => {
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings>({
    whatsappNumber: "+5491112345678",
    notificationsEnabled: true,
    autoNotify: true
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('whatsappSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as WhatsAppSettings;
        setWhatsAppSettings(settings);
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
