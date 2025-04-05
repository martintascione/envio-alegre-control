
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Server } from "lucide-react";
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
            Para que las notificaciones de WhatsApp funcionen a través de API, 
            necesitarás configurar un servidor backend.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium">Pasos para el despliegue completo:</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Construye tu aplicación React: <code>npm run build</code></li>
            <li>Sube los archivos de la carpeta <code>dist</code> a Hostinger</li>
            <li>Configura el servidor backend siguiendo las instrucciones en <code>server/README.md</code></li>
            <li>Actualiza la URL del endpoint en el código (<code>apiEndpoint</code> en <code>orderUtils.ts</code>)</li>
          </ol>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-medium">Opciones de API para WhatsApp:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h4 className="font-medium">WhatsApp Business API</h4>
              <p className="text-sm text-muted-foreground">API oficial de Meta para WhatsApp Business</p>
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Documentación oficial
              </a>
            </div>
            <div className="border rounded-md p-3">
              <h4 className="font-medium">Twilio</h4>
              <p className="text-sm text-muted-foreground">Servicio de mensajería que ofrece integración con WhatsApp</p>
              <a 
                href="https://www.twilio.com/docs/whatsapp/api" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Documentación oficial
              </a>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <p className="text-sm text-center">
          Para más detalles sobre la implementación del servidor backend, consulta el archivo 
          <Link to="/settings/server-docs" className="text-blue-600 hover:underline ml-1">
            server/README.md
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
