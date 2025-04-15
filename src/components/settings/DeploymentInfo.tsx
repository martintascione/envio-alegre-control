
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Server, Database, Hammer, FileCode, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import config from "@/config";

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
            <li>URL del sitio: <code>{window.location.hostname === 'localhost' ? 'https://grey-lion-594825.hostingersite.com' : window.location.origin}</code></li>
            <li>URL de la API: <code>{config.apiUrl}</code></li>
            <li>Base de datos: <code>u970205121_esimportar_dbe</code></li>
            <li>Usuario: <code>u970205121_martintascione</code></li>
            <li>Versión actual: <code>{config.version}</code></li>
            <li>Estado: <span className="text-amber-600 font-medium">En desarrollo</span></li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><FileCode className="h-4 w-4" /> Estructura de archivos correcta en Hostinger:</h3>
          <div className="bg-gray-50 p-3 rounded-md border">
            <pre className="text-xs overflow-x-auto">
{`public_html/
├── api/                   # Carpeta principal de la API
│   ├── config.php         # Configuración general
│   ├── index.php          # Punto de entrada de la API
│   ├── clients/           # API de clientes
│   │   └── index.php
│   ├── orders/            # API de pedidos
│   │   └── index.php
│   ├── settings/          # API de configuración
│   │   └── index.php
│   ├── whatsapp/          # API de WhatsApp
│   │   └── index.php
│   └── auth/              # API de autenticación
│       └── index.php
├── assets/                # Archivos estáticos
├── index.html             # Archivo principal
└── [otros archivos]       # Resto de archivos React
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
            <li>Sube <code>config.php</code> directamente en la carpeta <code>api</code></li>
            <li>Crea las subcarpetas <code>clients</code>, <code>orders</code>, <code>settings</code>, <code>whatsapp</code> y <code>auth</code> dentro de <code>api</code></li>
            <li>Sube los archivos <code>index.php</code> correspondientes a cada una de estas subcarpetas</li>
            <li>Importa el esquema SQL desde <code>server/database.sql</code> usando phpMyAdmin</li>
          </ol>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema detectado</AlertTitle>
          <AlertDescription>
            Según la imagen que has compartido, sólo existe la carpeta de clientes en tu servidor. 
            Debes crear todas las carpetas y archivos según la estructura mostrada arriba para que la aplicación funcione correctamente.
          </AlertDescription>
        </Alert>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2"><Database className="h-4 w-4" /> Estructura de Base de Datos:</h3>
          <div className="grid gap-3">
            <div className="border rounded-md p-3">
              <h4 className="font-medium">Tablas principales</h4>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li><code>clients</code>: Información de clientes</li>
                <li><code>orders</code>: Información de pedidos</li>
                <li><code>order_status_history</code>: Historial de estados de los pedidos</li>
                <li><code>settings</code>: Configuración del sistema</li>
                <li><code>message_templates</code>: Plantillas de mensajes</li>
                <li><code>users</code>: Usuarios del sistema (administradores)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-md border mt-2">
          <h4 className="font-medium">Pasos para verificar la instalación:</h4>
          <ol className="list-decimal pl-5 mt-2 space-y-2">
            <li>Prueba acceder directamente a <a href={`${config.apiUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{config.apiUrl}</a> - Deberías ver información sobre la API</li>
            <li>Prueba acceder a <a href={`${config.apiUrl}/clients`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{config.apiUrl}/clients</a> - Deberías ver un array JSON (posiblemente vacío)</li>
            <li>Intenta crear un nuevo cliente en la aplicación para verificar la conexión con la base de datos</li>
            <li>Verifica que no aparecen errores en la consola del navegador</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
