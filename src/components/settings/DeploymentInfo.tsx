
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Server, Database, Hammer, FileCode, CheckCircle } from "lucide-react";
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
          Instrucciones para desplegar esta aplicación en Hostinger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Para que las notificaciones de WhatsApp funcionen a través de API y 
            almacenar datos en la base de datos, necesitarás configurar el servidor backend.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><Hammer className="h-4 w-4" /> Pasos previos a la construcción:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Verifica que <code>src/config.js</code> esté configurado para usar la URL de tu API</li>
            <li>Actualiza <code>server/php/config.php</code> con las credenciales de tu base de datos</li>
            <li>Asegúrate de que todas las dependencias están instaladas: <code>npm install</code></li>
            <li>Construye la aplicación: <code>npm run build</code></li>
          </ol>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><FileCode className="h-4 w-4" /> Estructura de archivos en Hostinger:</h3>
          <div className="bg-gray-50 p-3 rounded-md border">
            <pre className="text-xs overflow-x-auto">
{`public_html/
├── api/                 # Carpeta para archivos PHP del backend
├── assets/              # Archivos estáticos (CSS, JS, imágenes)
├── index.html           # Archivo principal de la aplicación
└── [otros archivos]     # Resto de archivos compilados de React
`}
            </pre>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Pasos para el despliegue en Hostinger:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Sube los archivos de la carpeta <code>dist</code> a tu directorio principal <code>public_html</code> en Hostinger</li>
            <li>Crea la carpeta <code>api</code> dentro de <code>public_html</code> (si no existe)</li>
            <li>Sube los archivos PHP de la carpeta <code>server/php</code> a tu directorio <code>api</code> en Hostinger</li>
            <li>Crea una base de datos MySQL/MariaDB desde tu panel de Hostinger</li>
            <li>Importa el esquema SQL desde <code>server/database.sql</code> usando phpMyAdmin</li>
            <li>Actualiza <code>api/config.php</code> con tus credenciales de base de datos</li>
          </ol>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><Database className="h-4 w-4" /> Estructura de Base de Datos:</h3>
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
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md border mt-2">
          <h4 className="font-medium">Pasos para verificar la instalación:</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1 text-sm">
            <li>Accede a tu dominio principal en un navegador</li>
            <li>Intenta crear un nuevo cliente para verificar la conexión con la base de datos</li>
            <li>Verifica que no aparecen errores en la consola del navegador</li>
            <li>Si encuentras problemas, verifica los logs de PHP en tu panel de Hostinger</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
