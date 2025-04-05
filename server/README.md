
# Configuración del Servidor Backend para Notificaciones de WhatsApp

Este documento explica cómo configurar un servidor backend en Hostinger para manejar las notificaciones de WhatsApp.

## Opciones de Hosting en Hostinger

Hostinger ofrece diferentes planes que soportan PHP y Node.js. Para esta aplicación, recomendamos:

1. **Plan de Hosting con PHP**: Para una solución simple.
2. **Plan VPS**: Para mayor control y poder ejecutar Node.js.

## Opción 1: Implementación con PHP

### Requisitos
- Plan de hosting de Hostinger con PHP 7.4+
- Acceso FTP o SSH a tu cuenta de hosting

### Pasos para configurar el backend en PHP

1. **Crear el archivo API en PHP**

   Crea un archivo `api/send-whatsapp.php` en tu directorio público:

   ```php
   <?php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *'); // Reemplazar con tu dominio en producción
   header('Access-Control-Allow-Methods: POST, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type');

   // Manejar preflight request
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       exit(0);
   }

   // Recibir datos del cliente
   $data = json_decode(file_get_contents('php://input'), true);

   if (!$data || !isset($data['to']) || !isset($data['message'])) {
       http_response_code(400);
       echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
       exit;
   }

   $to = $data['to'];
   $from = $data['from'];
   $message = $data['message'];
   $provider = $data['provider'];
   $credentials = $data['credentials'] ?? [];

   $result = ['success' => false];

   if ($provider === 'direct') {
       // Implementar llamada a WhatsApp Business API
       $apiKey = $credentials['apiKey'] ?? '';
       if (empty($apiKey)) {
           http_response_code(400);
           echo json_encode(['success' => false, 'message' => 'API Key no proporcionada']);
           exit;
       }
       
       // Aquí implementarías la llamada real a la API de WhatsApp Business
       // Ejemplo básico usando cURL
       $response = sendViaWhatsAppBusiness($to, $message, $apiKey);
       $result = ['success' => $response['success']];
       
   } elseif ($provider === 'twilio') {
       // Implementar llamada a Twilio
       $twilioSid = $credentials['twilioSid'] ?? '';
       $twilioToken = $credentials['twilioToken'] ?? '';
       
       if (empty($twilioSid) || empty($twilioToken)) {
           http_response_code(400);
           echo json_encode(['success' => false, 'message' => 'Credenciales de Twilio incompletas']);
           exit;
       }
       
       // Aquí implementarías la llamada real a la API de Twilio
       $response = sendViaTwilio($to, $message, $from, $twilioSid, $twilioToken);
       $result = ['success' => $response['success']];
   }

   echo json_encode($result);
   exit;

   // Función para enviar mensaje usando WhatsApp Business API
   function sendViaWhatsAppBusiness($to, $message, $apiKey) {
       // Normalizar número de teléfono
       $to = preg_replace('/[^0-9]/', '', $to);
       
       // Configuración de la solicitud cURL para la API de WhatsApp Business
       $url = 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages'; // Reemplazar con tu ID
       
       $payload = [
           'messaging_product' => 'whatsapp',
           'to' => $to,
           'type' => 'text',
           'text' => [
               'body' => $message
           ]
       ];
       
       $ch = curl_init($url);
       curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
       curl_setopt($ch, CURLOPT_POST, true);
       curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
       curl_setopt($ch, CURLOPT_HTTPHEADER, [
           'Authorization: Bearer ' . $apiKey,
           'Content-Type: application/json'
       ]);
       
       $response = curl_exec($ch);
       $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
       $error = curl_error($ch);
       curl_close($ch);
       
       // Para desarrollo, registrar la respuesta
       file_put_contents('whatsapp_api_log.txt', date('Y-m-d H:i:s') . " - Response: $response\n", FILE_APPEND);
       
       if ($error) {
           return ['success' => false, 'message' => $error];
       }
       
       $responseData = json_decode($response, true);
       return [
           'success' => $httpCode >= 200 && $httpCode < 300 && isset($responseData['messages'][0]['id']),
           'data' => $responseData
       ];
   }

   // Función para enviar mensaje usando Twilio
   function sendViaTwilio($to, $message, $from, $accountSid, $twilioToken) {
       // Normalizar números de teléfono
       $to = preg_replace('/[^0-9]/', '', $to);
       $from = preg_replace('/[^0-9]/', '', $from);
       
       $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json";
       
       $ch = curl_init();
       curl_setopt($ch, CURLOPT_URL, $url);
       curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
       curl_setopt($ch, CURLOPT_POST, true);
       curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$twilioToken}");
       curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
           'From' => "whatsapp:+{$from}",
           'To' => "whatsapp:+{$to}",
           'Body' => $message
       ]));
       
       $response = curl_exec($ch);
       $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
       $error = curl_error($ch);
       curl_close($ch);
       
       // Para desarrollo, registrar la respuesta
       file_put_contents('twilio_api_log.txt', date('Y-m-d H:i:s') . " - Response: $response\n", FILE_APPEND);
       
       if ($error) {
           return ['success' => false, 'message' => $error];
       }
       
       $responseData = json_decode($response, true);
       return [
           'success' => $httpCode >= 200 && $httpCode < 300 && isset($responseData['sid']),
           'data' => $responseData
       ];
   }
   ```

2. **Configurar CORS**

   Si tu frontend y backend están en dominios diferentes, asegúrate de configurar correctamente los encabezados CORS en el archivo `.htaccess`:

   ```apache
   <IfModule mod_headers.c>
       Header set Access-Control-Allow-Origin "https://tu-dominio-frontend.com"
       Header set Access-Control-Allow-Methods "POST, OPTIONS"
       Header set Access-Control-Allow-Headers "Content-Type"
       Header set Access-Control-Max-Age "3600"
   </IfModule>
   ```

## Opción 2: Implementación con Node.js (VPS de Hostinger)

### Requisitos
- Plan VPS de Hostinger
- Node.js 14+ instalado
- PM2 para mantener el servidor funcionando

### Pasos para configurar el backend en Node.js

1. **Crear el servidor Express**

   ```javascript
   const express = require('express');
   const cors = require('cors');
   const axios = require('axios');
   const twilio = require('twilio');
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   app.use(cors({
     origin: 'https://tu-dominio-frontend.com', // Cambiar por tu dominio frontend
     methods: ['POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type']
   }));
   
   app.use(express.json());
   
   app.post('/api/send-whatsapp', async (req, res) => {
     try {
       const { to, from, message, provider, credentials } = req.body;
       
       if (!to || !message) {
         return res.status(400).json({ success: false, message: 'Datos incompletos' });
       }
       
       let success = false;
       
       if (provider === 'direct') {
         // Validar APIKey
         if (!credentials?.apiKey) {
           return res.status(400).json({ success: false, message: 'API Key no proporcionada' });
         }
         
         // Enviar usando WhatsApp Business API
         success = await sendViaWhatsAppBusiness(to, message, credentials.apiKey);
       } else if (provider === 'twilio') {
         // Validar credenciales de Twilio
         if (!credentials?.twilioSid || !credentials?.twilioToken) {
           return res.status(400).json({ success: false, message: 'Credenciales de Twilio incompletas' });
         }
         
         // Enviar usando Twilio
         success = await sendViaTwilio(to, message, from, credentials.twilioSid, credentials.twilioToken);
       } else {
         return res.status(400).json({ success: false, message: 'Proveedor no soportado' });
       }
       
       res.json({ success });
     } catch (error) {
       console.error('Error al enviar mensaje:', error);
       res.status(500).json({ success: false, message: error.message });
     }
   });
   
   async function sendViaWhatsAppBusiness(to, message, apiKey) {
     try {
       // Normalizar número de teléfono
       const normalizedPhone = to.replace(/\+|\s/g, '');
       
       const response = await axios.post(
         'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', // Cambiar por tu ID
         {
           messaging_product: "whatsapp",
           to: normalizedPhone,
           type: "text",
           text: {
             body: message
           }
         },
         {
           headers: {
             'Authorization': `Bearer ${apiKey}`,
             'Content-Type': 'application/json'
           }
         }
       );
       
       return response.data && response.data.messages && response.data.messages[0].id;
     } catch (error) {
       console.error('Error WhatsApp API:', error.response?.data || error.message);
       return false;
     }
   }
   
   async function sendViaTwilio(to, message, from, accountSid, authToken) {
     try {
       // Normalizar números de teléfono
       const normalizedToPhone = to.replace(/\+|\s/g, '');
       const normalizedFromPhone = from.replace(/\+|\s/g, '');
       
       const client = twilio(accountSid, authToken);
       const response = await client.messages.create({
         body: message,
         from: `whatsapp:+${normalizedFromPhone}`,
         to: `whatsapp:+${normalizedToPhone}`
       });
       
       return !!response.sid;
     } catch (error) {
       console.error('Error Twilio:', error);
       return false;
     }
   }
   
   app.listen(PORT, () => {
     console.log(`Servidor ejecutándose en puerto ${PORT}`);
   });
   ```

2. **Instalar dependencias necesarias**

   ```
   npm init -y
   npm install express cors axios twilio
   npm install pm2 -g
   ```

3. **Configurar PM2 para mantener el servidor funcionando**

   ```
   pm2 start server.js --name whatsapp-api
   pm2 startup
   pm2 save
   ```

## Despliegue de la Aplicación Web React

Para desplegar la aplicación web React en Hostinger:

1. Construir la aplicación para producción:
   ```
   npm run build
   ```

2. Subir los archivos de la carpeta `dist` o `build` al directorio público de tu hosting en Hostinger (normalmente `public_html`).

3. Configurar la URL del backend en la aplicación:
   - En producción, asegúrate de que la constante `apiEndpoint` en `orderUtils.ts` apunte a la URL correcta de tu backend.

## Registrarse en APIs de WhatsApp

### WhatsApp Business API
1. Regístrate en [Facebook for Developers](https://developers.facebook.com/)
2. Crea una aplicación de Facebook
3. Agrega WhatsApp Business API a tu aplicación
4. Sigue los pasos para verificar tu negocio
5. Obtén el token de acceso para tu aplicación

### Twilio
1. Regístrate en [Twilio](https://www.twilio.com/)
2. Activa el producto WhatsApp de Twilio
3. Obtén tu Account SID y Auth Token
4. Configura tu número de WhatsApp en el panel de Twilio

## Notas importantes

- **Seguridad**: En un entorno de producción real, deberías almacenar tus claves API y tokens de forma segura usando variables de entorno o un sistema de secretos.
- **Costos**: Ten en cuenta que tanto WhatsApp Business API como Twilio tienen costos asociados al envío de mensajes.
- **Límites**: WhatsApp Business API tiene restricciones sobre los tipos de mensajes que puedes enviar y cuándo puedes enviarlos.
