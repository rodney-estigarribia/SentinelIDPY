# Plan: GitHub Actions Auto-Deploy del Plugin WordPress

## Objetivo

Cada vez que se hace `git push` a `main` con cambios en `sentinel-idpy-connector.php`,
GitHub Actions despliega automáticamente el plugin actualizado a todos los servidores
de clientes configurados — sin ninguna acción manual.

---

## Flujo completo

```
Developer hace cambio al .php
    ↓
git push → main
    ↓
GitHub Actions detecta cambio en src/wordpress-plugin/sentinel-idpy-connector.php
    ↓
Para cada cliente configurado en deploy-targets.json:
    ├── Conecta por SSH al servidor
    ├── Copia el archivo nuevo vía SCP
    └── Opcional: recarga el plugin con WP-CLI
    ↓
Resultado: éxito/fallo por cliente notificado en el log del workflow
```

---

## Archivos a crear / modificar

```
SentinelIDPY/
├── .github/
│   └── workflows/
│       └── deploy-plugin.yml          ← NUEVO: workflow de deploy
├── src/
│   └── wordpress-plugin/
│       └── sentinel-idpy-connector.php  (sin cambios)
├── maintenance_bot/
│   └── deploy-targets.json            ← NUEVO: config de servidores (no commitear credenciales)
└── Makefile                           ← AGREGAR: target make deploy-plugin (fallback manual)
```

---

## 1. deploy-targets.json

Archivo en `maintenance_bot/deploy-targets.json` con los datos SSH por cliente.
**Este archivo NO se commitea** (agregar a `.gitignore`).
En su lugar, se commitea `deploy-targets.example.json` como referencia.

```json
[
  {
    "id": 1,
    "nombre": "IDPY",
    "ssh_host": "servidor.idpy.com",
    "ssh_user": "deploy",
    "ssh_port": 22,
    "plugin_path": "/var/www/html/wp-content/plugins/sentinel-idpy-connector/sentinel-idpy-connector.php"
  },
  {
    "id": 3,
    "nombre": "CGA Portal",
    "ssh_host": "cga.example.com",
    "ssh_user": "deploy",
    "ssh_port": 22,
    "plugin_path": "/srv/www/wp-content/plugins/sentinel-idpy-connector/sentinel-idpy-connector.php"
  }
]
```

> **Nota:** No todos los clientes necesitan estar aquí. Solo los que tienen
> el plugin instalado y acceso SSH configurado.

---

## 2. GitHub Secrets necesarios

En el repo GitHub → Settings → Secrets and variables → Actions:

| Secret | Contenido |
|---|---|
| `PLUGIN_DEPLOY_SSH_KEY` | Clave privada SSH (ed25519 recomendada) |
| `DEPLOY_TARGETS_JSON` | Contenido completo del `deploy-targets.json` |

La clave pública correspondiente a `PLUGIN_DEPLOY_SSH_KEY` debe estar en
`~/.ssh/authorized_keys` de cada servidor de cliente.

### Generar la clave SSH de deploy

```bash
# Generar par de claves (sin passphrase para CI/CD)
ssh-keygen -t ed25519 -C "sentinel-deploy@github-actions" -f ~/.ssh/sentinel_deploy -N ""

# Clave privada → pegar en GitHub Secret PLUGIN_DEPLOY_SSH_KEY
cat ~/.ssh/sentinel_deploy

# Clave pública → agregar a cada servidor cliente
cat ~/.ssh/sentinel_deploy.pub
# Pegar en: /home/deploy/.ssh/authorized_keys en cada servidor
```

---

## 3. .github/workflows/deploy-plugin.yml

```yaml
name: Deploy WordPress Plugin

on:
  push:
    branches: [main]
    paths:
      - 'src/wordpress-plugin/sentinel-idpy-connector.php'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.PLUGIN_DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          echo "StrictHostKeyChecking no" >> ~/.ssh/config

      - name: Deploy to all targets
        run: |
          echo '${{ secrets.DEPLOY_TARGETS_JSON }}' > /tmp/targets.json
          
          jq -c '.[]' /tmp/targets.json | while read target; do
            NOMBRE=$(echo $target | jq -r '.nombre')
            HOST=$(echo $target   | jq -r '.ssh_host')
            USER=$(echo $target   | jq -r '.ssh_user')
            PORT=$(echo $target   | jq -r '.ssh_port')
            PATH=$(echo $target   | jq -r '.plugin_path')

            echo "→ Desplegando a $NOMBRE ($HOST)..."

            scp -i ~/.ssh/deploy_key -P $PORT \
              src/wordpress-plugin/sentinel-idpy-connector.php \
              $USER@$HOST:$PATH

            if [ $? -eq 0 ]; then
              echo "✓ $NOMBRE: deploy exitoso"
            else
              echo "✗ $NOMBRE: deploy FALLIDO"
              EXIT_CODE=1
            fi
          done

          exit ${EXIT_CODE:-0}

      - name: Notify on failure
        if: failure()
        run: |
          echo "Uno o más deploys fallaron. Revisar logs del workflow."
          # Aquí se podría agregar una notificación a Telegram
```

---

## 4. Makefile — fallback manual

Agregar al `Makefile` existente un target para deploy manual:

```makefile
deploy-plugin:
	@which jq > /dev/null || (echo "Error: jq no instalado" && exit 1)
	@test -f maintenance_bot/deploy-targets.json || (echo "Error: deploy-targets.json no encontrado" && exit 1)
	@echo "Desplegando plugin a todos los servidores..."
	@jq -c '.[]' maintenance_bot/deploy-targets.json | while read target; do \
		NOMBRE=$$(echo $$target | jq -r '.nombre'); \
		HOST=$$(echo $$target   | jq -r '.ssh_host'); \
		USER=$$(echo $$target   | jq -r '.ssh_user'); \
		PORT=$$(echo $$target   | jq -r '.ssh_port'); \
		RPATH=$$(echo $$target  | jq -r '.plugin_path'); \
		echo "→ $$NOMBRE ($$HOST)..."; \
		scp -P $$PORT src/wordpress-plugin/sentinel-idpy-connector.php $$USER@$$HOST:$$RPATH \
			&& echo "  ✓ OK" || echo "  ✗ FALLO"; \
	done
```

Uso:
```bash
make deploy-plugin        # despliega a todos
```

---

## 5. Cómo agregar un cliente nuevo

1. Agregar su entrada en `maintenance_bot/deploy-targets.json`
2. Copiar la clave pública a `~/.ssh/authorized_keys` en ese servidor
3. Actualizar el Secret `DEPLOY_TARGETS_JSON` en GitHub con el JSON completo

---

## 6. Consideraciones de seguridad

- El usuario `deploy` en cada servidor debe tener permisos mínimos:
  solo escritura en la carpeta del plugin, nada más.
- Usar `ed25519` (más seguro y liviano que RSA)
- `StrictHostKeyChecking no` es aceptable en CI/CD pero documentarlo
- El `deploy-targets.json` local **nunca** debe ir al repo — solo el `.example.json`
- Agregar `maintenance_bot/deploy-targets.json` a `.gitignore`

---

## 7. Orden de implementación

- [ ] Generar par de claves SSH de deploy
- [ ] Crear usuario `deploy` con permisos mínimos en cada servidor cliente
- [ ] Copiar clave pública a cada servidor
- [ ] Crear `maintenance_bot/deploy-targets.json` con los datos de cada cliente
- [ ] Crear `maintenance_bot/deploy-targets.example.json` (sin datos reales)
- [ ] Agregar secrets en GitHub: `PLUGIN_DEPLOY_SSH_KEY` y `DEPLOY_TARGETS_JSON`
- [ ] Crear `.github/workflows/deploy-plugin.yml`
- [ ] Agregar `make deploy-plugin` al Makefile
- [ ] Agregar `deploy-targets.json` al `.gitignore`
- [ ] Hacer un push de prueba y verificar en GitHub Actions

---

## Estado

> **Pendiente de implementación** — esperando resultados del diagnóstico
> de datos (Wordfence, Matomo, plugins) antes de continuar con esto.
