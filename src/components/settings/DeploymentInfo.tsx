
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Server, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export function DeploymentInfo() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Información de Despliegue
        </CardTitle>
        <CardDescription>
          Instrucciones para desplegar esta aplicación con un servidor backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Para que las notificaciones de WhatsApp funcionen a través de API y 
            almacenar datos en la nube, necesitarás configurar un servidor backend.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium">Pasos para el despliegue en Hostinger:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Construye tu aplicación React: <code>npm run build</code></li>
            <li>Sube los archivos de la carpeta <code>dist</code> a tu hosting en Hostinger</li>
            <li>Crea una base de datos MySQL/MariaDB desde tu panel de Hostinger</li>
            <li>Crea las tablas necesarias utilizando el script SQL proporcionado en <code>server/database.sql</code></li>
            <li>Sube los archivos PHP de la carpeta <code>server/php</code> a tu directorio <code>api</code> en Hostinger</li>
            <li>Configura la conexión a la base de datos editando <code>server/php/config.php</code> con tus credenciales</li>
            <li>Actualiza la URL de la API en <code>src/config.js</code> para que apunte a tu dominio</li>
          </ol>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><Database className="h-4 w-4" /> Estructura de Base de Datos en Hostinger:</h3>
          <div className="grid gap-3">
            <div className="border rounded-md p-3">
              <h4 className="font-medium">Tablas principales</h4>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li><code>clients</code>: Información de clientes</li>
                <li><code>orders</code>: Información de pedidos</li>
                <li><code>order_status</code>: Historial de estados de los pedidos</li>
                <li><code>settings</code>: Configuración del sistema y plantillas de mensajes</li>
                <li><code>users</code>: Usuarios del sistema (administradores)</li>
              </ul>
            </div>
            
            <div className="border rounded-md p-3">
              <h4 className="font-medium">Ejemplo de API Backend</h4>
              <p className="text-sm text-muted-foreground mt-1">Endpoints principales que deberás implementar:</p>
              <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                <li><code>/api/clients</code> - CRUD para gestionar clientes</li>
                <li><code>/api/orders</code> - CRUD para gestionar pedidos</li>
                <li><code>/api/settings</code> - Configuración del sistema</li>
                <li><code>/api/whatsapp</code> - Envío de notificaciones por WhatsApp</li>
                <li><code>/api/auth</code> - Autenticación de usuarios</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <p className="text-sm">
          Para instrucciones detalladas sobre la creación de la API backend en PHP para Hostinger, 
          consulta la documentación en la carpeta <code>server/docs/</code>
        </p>
        
        <div className="bg-gray-50 p-3 rounded-md border mt-2">
          <h4 className="font-medium">Pasos para migrar desde datos locales a base de datos:</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1 text-sm">
            <li>Implementa el servidor backend en Hostinger siguiendo los pasos anteriores</li>
            <li>Crea un archivo <code>src/config.js</code> con la URL de tu API</li>
            <li>Configura los servicios para conectar con la API en vez de usar datos locales</li>
            <li>Implementa autenticación de usuarios para proteger tus datos</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
