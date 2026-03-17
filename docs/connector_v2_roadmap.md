# SentinelIDPY Connector - Roadmap

## Visión General
El objetivo del plugin **SentinelIDPY Connector** es evolucionar desde un simple extractor de Wordfence hacia un sistema integral de monitoreo administrable remotamente.

---

## ✅ Fase 1: Enriquecimiento de Datos (COMPLETADO)
Se ha completado la migración desde la V1 (solo Wordfence) a la V2 funcional:
- [x] Extracción de métricas de **Infraestructura** (Disco, versiones de PHP/WP).
- [x] Monitoreo de **Mantenimiento** (UpdraftPlus, Plugins actualizados).
- [x] Estado de **Salud** y **Certificados SSL**.
- [x] Resultados de escaneo de **Malware** de Wordfence.

---

## 🚀 Fase 2: Administración y Escalabilidad (Pendiente)

Para escalar el mantenimiento a cientos de clientes, el roadmap ahora se enfoca en:

### 1. Sistema de Actualización Automática Integrado
- **Integración con GitHub**: El código fuente residirá en este repositorio.
- **Update Checker**: Integrar la librería [Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker) para que los clientes detecten y apliquen actualizaciones de seguridad automáticamente desde el WP Admin.

### 2. Migración de Configuración a Base de Datos
- **Eliminar Hardcode**: Mover la constante `WF_REPORT_TOKEN_INTERNAL` a un ajuste guardado en `wp_options`.
- **Panel de Ajustes**: Crear una página simple en `Ajustes -> SentinelIDPY` para que el usuario pegue su token sin editar archivos PHP.
- **Validación Dinámica**: El plugin usará `get_option()` para validar las peticiones REST, permitiendo actualizaciones de código sin perder la clave de acceso.

### Pasos Siguientes:
1. Diseñar el panel de administración en WordPress.
2. Refactorizar la validación del token para leer de la base de datos.
3. Configurar el *update checker* apuntando a los *releases* de GitHub.
