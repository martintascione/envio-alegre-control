
# Backend para ESIMPORTAR - Guía de Implementación

Esta guía te ayudará a implementar el backend para ESIMPORTAR en tu servidor de Hostinger.

## Estructura de Archivos

```
server/
├── database.sql           # Script SQL para crear las tablas
├── php/                   # Código PHP para la API
│   ├── config.php         # Configuración de la base de datos y autenticación
│   ├── api/               # Endpoints de la API
│   │   ├── auth/          # Autenticación
│   │   ├── clients/       # CRUD de clientes
│   │   ├── orders/        # CRUD de pedidos
│   │   ├── settings/      # Configuración
│   │   └── whatsapp/      # Envío de notificaciones
```

## Pasos para la Implementación

1. **Crear la Base de Datos**

   - Accede a tu panel de Hostinger y ve a la sección "Bases de datos"
   - Crea una nueva base de datos MySQL
   - Anota el nombre de la base de datos, usuario y contraseña

2. **Importar el Esquema de la Base de Datos**

   - En tu panel de Hostinger, accede a phpMyAdmin
   - Selecciona tu base de datos
   - Ve a la pestaña "Importar"
   - Sube el archivo `database.sql` 
   - Haz clic en "Importar" para crear las tablas

3. **Configurar el Backend**

   - Edita el archivo `php/config.php` con tus credenciales de base de datos
   - Sube todos los archivos de la carpeta `php/` a tu directorio de API en Hostinger (por ejemplo, `public_html/api/`)
   - Asegúrate de que el usuario de PHP tenga permisos para escribir en el directorio si planeas subir archivos

4. **Configurar el Frontend**

   - Edita `src/config.js` para que apunte a la URL correcta de tu API
   - Construye tu aplicación con `npm run build`
   - Sube todos los archivos de la carpeta `dist/` a tu directorio principal en Hostinger (normalmente `public_html/`)

5. **Probar la Conexión**

   - Accede a tu dominio para verificar que la aplicación funciona correctamente
   - Intenta crear un cliente para probar la conexión con la API

## Seguridad

Es importante tener en cuenta algunas consideraciones de seguridad:

- El ejemplo incluido utiliza una implementación básica de JWT. En un entorno de producción, considera usar una biblioteca como `firebase/php-jwt`.
- Cambia la contraseña predeterminada del usuario administrador después del primer inicio de sesión.
- Configura HTTPS en tu dominio para proteger las comunicaciones.
- Ajusta la configuración CORS en `config.php` para permitir solo tu dominio.

## Problemas Comunes

- **Error 500**: Verifica los logs de error de PHP en tu panel de Hostinger.
- **CORS**: Asegúrate de que tu configuración CORS en `config.php` permita el origen de tu frontend.
- **Permisos**: Algunos hosts requieren ajustes de permisos en archivos y directorios.

Para más ayuda, contacta al soporte de Hostinger o consulta la [documentación oficial de PHP](https://www.php.net/docs.php).
