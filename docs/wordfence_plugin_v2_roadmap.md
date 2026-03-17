# Wordfence API Plugin - V2 Roadmap

## Visión General
El objetivo de la Versión 2 (V2) del plugin para WordPress es evolucionar desde un modelo de configuración "hardcodeada" (V1) hacia un sistema administrable remotamente, que permita actualizaciones automáticas en múltiples clientes simultáneamente sin requerir la edición de archivos.

## Problema Actual (V1)
Actualmente, el plugin `wordfence-api-snippet.php` contiene la clave de seguridad (`WF_REPORT_TOKEN_INTERNAL`) directamente en su código base. 
Esto significa que si la clave debe cambiarse, o si se desea aplicar un parche de seguridad al código del plugin, se debe crear un nuevo archivo `.zip` y subirlo manualmente a todos y cada uno de los sitios de WordPress administrados. No hay una forma centralizada de enviar actualizaciones de código a los clientes.

## Solución Propuesta (V2)

Para escalar el mantenimiento, la V2 implementará las siguientes características:

### 1. Sistema de Actualización Automática Integrado
- **Integración con GitHub/Servidor Central**: El código fuente principal del plugin residirá en un repositorio (público o privado), o en un servidor propio con un archivo JSON estructurado (ej. `info.json`).
- **Update Checker**: Se integrará una librería ligera en el plugin (por ejemplo, [Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker)). Esta librería comprobará periódicamente el repositorio central.
- **Flujo de Usuario**: Cuando detecte un cambio de versión en el servidor central, WordPress mostrará la notificación nativa de "Actualización Disponible" en la pantalla de Plugins del cliente, permitiendo la actualización a un clic (o actualización automática si WordPress está configurado así).

### 2. Migración del Token a la Base de Datos
Debido a que el código del plugin se sobrescribirá con cada actualización desde el servidor central, cualquier clave hardcodeada en el archivo original se perderá (o, inversamente, todos los clientes estarían obligados a descargar la misma clave hardcodeada desde el respositorio).

- **Opciones de Configuración (`get_option()`)**: La clave de autenticación se trasladará del archivo `.php` a la tabla `wp_options` de la base de datos de cada cliente.
- **Página de Ajustes V2**: El plugin generará un submenú simple (e.g., `Ajustes -> Sentinel IDPY`) dentro del WP Admin del sitio cliente. 
- **Flujo**: 
  1. Al instalar la V2 del plugin, la página de configuración estará en blanco o pedirá una clave.
  2. El administrador pegará la clave secreta de 32+ caracteres generada para ese nodo en particular.
  3. El plugin usará `get_option('sentinel_wf_token')` en la validación de sus endpoints REST.
  4. Cuando el plugin se actualice centralizadamente mañana, la base de datos permanecerá intacta y el sitio seguirá autenticándose correctamente y de manera segura.

### Pasos Técnicos para Implementar la V2

1. Diseñar el panel de administración simple (HTML en WP) para guardar la clave.
2. Refactorizar el endpoint REST (`verify_wf_report_token`) para leer de la base de datos y lanzar un aviso en caso de que la clave aún no se haya configurado.
3. Incorporar el script de *Update Checker* apuntando al branch `main` de este repositorio o servidor web (idealmente de una carpeta estática o un _release_ de GitHub).
4. Preparar la primera versión del `.zip` para distribuir.
