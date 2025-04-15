
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
            Para almacenar datos en la base de datos, necesitarás completar la configuración del servidor backend.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><Hammer className="h-4 w-4" /> Información del sitio:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>URL del sitio: <code>https://grey-lion-594825.hostingersite.com</code></li>
            <li>Base de datos: <code>u970205121_esimportar_dbe</code></li>
            <li>Usuario: <code>u970205121_martintascione</code></li>
            <li>Estado: <span className="text-amber-600 font-medium">En desarrollo</span></li>
          </ul>
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
            <li>Ejecuta <code>npm run build</code> para generar la carpeta <code>dist</code></li>
            <li>Sube los archivos de la carpeta <code>dist</code> a tu directorio principal <code>public_html</code> en Hostinger</li>
            <li>Crea la carpeta <code>api</code> dentro de <code>public_html</code> (si no existe)</li>
            <li>Sube los archivos PHP de la carpeta <code>server/php</code> a tu directorio <code>api</code> en Hostinger</li>
            <li>Importa el esquema SQL desde <code>server/database.sql</code> usando phpMyAdmin</li>
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
            <li>Accede a tu sitio en <a href="https://grey-lion-594825.hostingersite.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">grey-lion-594825.hostingersite.com</a></li>
            <li>Inicia sesión con el usuario: <code>admin</code> y contraseña: <code>admin123</code></li>
            <li>Intenta crear un nuevo cliente para verificar la conexión con la base de datos</li>
            <li>Verifica que no aparecen errores en la consola del navegador</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
