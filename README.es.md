<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md"><strong>Español</strong></a> ·
  <a href="README.fr.md">Français</a>
</p>

<p align="center">
  <img src="docs/images/vidselector-hero.png" alt="Banner abstracto de VidSelector con tarjetas de películas y una ruta de recomendaciones personal" width="100%">
</p>

<h1 align="center">VidSelector</h1>

<p align="center">
  <strong>Una aplicación privada y autoalojada de recomendaciones de películas y series, sin seguimiento y con recomendaciones explicables.</strong>
</p>

<p align="center">
  <a href="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml"><img src="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml/badge.svg" alt="Estado de CI"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite" alt="Base de datos SQLite local">
  <img src="https://img.shields.io/badge/uso-personal%20y%20no%20comercial-ef4056" alt="Uso personal y no comercial">
</p>

![Panel de VidSelector](docs/images/dashboard.png)

VidSelector es una aplicación web local para valorar películas y series y convertir esas valoraciones en recomendaciones personales. De forma predeterminada utiliza un solo perfil, aunque puede habilitar perfiles locales separados para los miembros del hogar. No hay inicio de sesión, publicidad, seguimiento externo ni un servicio alojado de VidSelector: los perfiles y las valoraciones permanecen en tu propia base de datos SQLite.

> [!IMPORTANT]
> VidSelector es un proyecto personal, no comercial y creado como afición. No es un servicio de streaming ni una plataforma multiusuario pública.

## ¿Por qué VidSelector?

- **Tus propias valoraciones:** `Me gusta`, `Neutral` o `No es para mí`
- **Lista sencilla:** guarda o elimina títulos interesantes con un clic
- **Recomendaciones basadas en reglas:** puntuaciones explicables en lugar de una IA opaca
- **Películas y series separadas:** en categorías, búsqueda y biblioteca
- **Navegación inspirada en Netflix:** carruseles, flechas dinámicas y páginas «Ver más»
- **Anime como faceta propia:** distingue la animación japonesa de la occidental
- **Detalles completos:** reparto, equipo creativo, duración, temporadas, tráileres y títulos similares
- **Disponibilidad en Alemania:** opciones separadas para streaming, alquiler y compra
- **Caché local-first:** se consulta SQLite antes que TMDB
- **Protección local de los datos:** exportación versionada, importación validada y copias automáticas
- **Modo de demostración:** prueba la aplicación sin credenciales de API
- **Interfaz adaptable:** para escritorio y móvil
- **Interfaz multilingüe:** alemán, inglés, español y francés por perfil
- **Gestión de perfiles opcional:** perfiles locales separados sin cuentas en la nube ni inicio de sesión
- **Configuración YAML validada:** servidor, recomendaciones, copias, registros e indicadores de funciones

## Inicio rápido

### Docker (recomendado para el autoalojamiento)

Requisito: Docker Engine con el complemento Docker Compose.

```bash
git clone https://github.com/DevMatze/VidSelector.git
cd VidSelector
docker compose up -d --build
```

Abre [http://localhost:3000](http://localhost:3000). Sin credenciales de TMDB, el contenedor se inicia directamente con el catálogo de demostración integrado. Comprueba el estado y los registros con:

```bash
docker compose ps
docker compose logs -f vidselector
```

### Desde el código fuente

Requisitos:

- Node.js 20 o posterior (CI utiliza Node.js 22)
- npm
- opcional: acceso gratuito a la API de TMDB para usar el catálogo completo

```bash
git clone https://github.com/DevMatze/VidSelector.git
cd VidSelector
npm install
cp .env.example .env
cp config.example config.yml
npm run setup
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el ordenador. Sin credenciales de TMDB, VidSelector utiliza automáticamente el catálogo de demostración integrado.

`npm run setup` aplica las migraciones de la base de datos y crea un pequeño perfil de ejemplo. Para comenzar sin datos de ejemplo, utiliza:

```bash
npm run db:push
```

## Cómo funcionan las recomendaciones

VidSelector no entrena ningún modelo de IA ni de aprendizaje automático. Las recomendaciones se generan localmente mediante una ponderación transparente basada en reglas:

```text
Valoraciones
   │
   ├── géneros y faceta de anime
   ├── idioma original y década
   ├── reparto y equipo creativo
   └── títulos similares valorados positiva o negativamente
            │
            ▼
    puntuación ponderada
            │
            ▼
   recomendaciones diversificadas
```

La valoración pública, el número de votos y la popularidad actúan como señales de calidad adicionales. Los títulos ya valorados se excluyen, mientras que los patrones negativos reducen activamente la puntuación de candidatos similares. Las impresiones repetidas, los clics ponderados con prudencia y los títulos omitidos de forma explícita mejoran la rotación sin sustituir una valoración real. Los pesos principales se definen en [`lib/recommendations/config.ts`](lib/recommendations/config.ts).

### Portada limitada, categorías completas

- **Selección principal para ti:** hasta 50 películas y 50 series destacadas de forma predeterminada
- **Películas para ti:** hasta 50 películas adicionales fuera de las selecciones principal y de descubrimiento
- **Series para ti:** hasta 50 series adicionales fuera de las selecciones principal y de descubrimiento
- **Prueba algo nuevo:** hasta 50 descubrimientos independientes de películas y series

Los cupos de películas y series se cuentan de forma independiente, pero cada título solo se asigna a una sección de la portada. Las páginas «Ver más» relacionadas no tienen el límite de 50 títulos: muestran todo el conjunto de recomendaciones calculado para la categoría elegida, inicialmente 20 títulos y después lotes de 20 de forma predeterminada. Ambos valores pueden modificarse en `config.yml`. Como estas vistas ampliadas filtran por significado y no por los cupos de la portada, un título relevante puede aparecer en varias vistas adecuadas.

### Valoraciones y lista

Una valoración describe tus gustos: «Me gusta» refuerza atributos similares, «No es para mí» los debilita y «Neutral» guarda el título sin una preferencia positiva o negativa. La lista es independiente y solo sirve para guardar títulos interesantes para más adelante.

### ¿Anime o animación?

TMDB no incluye el anime como género propio. VidSelector deriva esta faceta de dos atributos explícitos:

```text
Género «Animación» + idioma original japonés = Anime
```

Así se separan, por ejemplo, las series de anime japonesas de las producciones de animación occidentales. Esta heurística deliberadamente sencilla puede variar en coproducciones internacionales.

## Privacidad y seguridad

- sin cuentas en línea ni sincronización en la nube
- sin servicios de analítica, publicidad o seguimiento
- autenticación con TMDB en el servidor
- comprobaciones de origen para las solicitudes de escritura de la API
- límites de frecuencia en las rutas con uso intensivo de la API
- exportaciones y copias locales validadas
- cabeceras de seguridad

Los perfiles, las valoraciones, la lista, el historial de recomendaciones y las señales anónimas de interacción con las recomendaciones se almacenan localmente en SQLite. Las credenciales de TMDB permanecen en el servidor Next.js y nunca deben incluirse en Git ni en capturas de pantalla.

No informes de problemas de seguridad mediante una incidencia pública. Sigue las indicaciones de [`SECURITY.md`](SECURITY.md).

## Limitaciones y modelo de amenazas

- VidSelector no proporciona películas, series ni transmisiones.
- La disponibilidad la proporcionan TMDB/JustWatch, está enfocada en Alemania y puede cambiar.
- La aplicación no tiene autenticación ni control de acceso. Todo dispositivo que pueda acceder al puerto 3000 puede elegir perfiles y modificar sus datos.
- Los perfiles locales son una comodidad para una red doméstica de confianza, no cuentas de usuario seguras.
- No configures el reenvío de puertos en el router ni uses VidSelector en una red Wi-Fi pública o que no sea de confianza.
- Un despliegue público requeriría antes autenticación real, TLS y una revisión de seguridad independiente.
- El código fuente es visible públicamente, pero no cuenta con una licencia de código abierto; consulta [Licencia](#licencia).

## Instalación y configuración completas

### Configuración, almacenamiento y actualizaciones con Docker

Docker almacena la base de datos SQLite y las copias de seguridad en volúmenes con nombre separados. Los datos personales se conservan al recrear o actualizar el contenedor:

```text
vidselector_data      /data/vidselector.db
vidselector_backups   /app/backups
```

Para activar TMDB, copia `.env.example` como `.env`, introduce `TMDB_BEARER_TOKEN` o `TMDB_API_KEY` y vuelve a crear el contenedor:

```bash
cp .env.example .env
docker compose up -d --force-recreate
```

La configuración segura predeterminada publica VidSelector solo en `127.0.0.1`. Para acceder desde una red doméstica de confianza, define `VIDSELECTOR_BIND_ADDRESS=0.0.0.0` en `.env`. No uses esta opción en redes públicas o que no sean de confianza ni configures el reenvío de puertos del router.

Para utilizar ajustes propios, copia `config.example` como `config.yml` y define `VIDSELECTOR_CONFIG_FILE=./config.yml` en `.env`. El archivo se monta en el contenedor como solo lectura.

Antes de actualizar, crea una copia adicional de la base de datos, reconstruye la imagen y vuelve a crear el contenedor:

```bash
docker compose exec vidselector ./node_modules/.bin/tsx scripts/backup-database.ts
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

El script de inicio crea otra copia antes de aplicar las migraciones pendientes de Prisma. `docker compose down` elimina el contenedor, pero conserva ambos volúmenes. **No utilices `docker compose down -v` salvo que quieras eliminar deliberadamente la base de datos y las copias.**

### Acceso desde la red local

El servidor de desarrollo también escucha en la red local. Si el ordenador y el teléfono están conectados a la misma red Wi-Fi, abre en el teléfono una dirección como `http://192.168.0.242:3000`, sustituyéndola por la IP LAN real del ordenador. En Linux, `hostname -I` puede mostrarla.

Si no puedes acceder a la página, comprueba que ambos dispositivos estén en la misma red y que el cortafuegos local permita conexiones TCP entrantes al puerto 3000 desde la red privada. El reenvío de puertos del router no es necesario ni recomendable.

### Activar TMDB

Para usar el catálogo completo:

1. Crea credenciales en [TMDB API Settings](https://www.themoviedb.org/settings/api).
2. Abre `.env` e introduce preferentemente el token de acceso de lectura v4.
3. Define `catalog.force_demo: false` en `config.yml` y reinicia el servidor.

```dotenv
TMDB_BEARER_TOKEN=
TMDB_API_KEY=
DATABASE_URL="file:./dev.db"
```

Como alternativa, se admite la clave clásica `TMDB_API_KEY`. Ambas credenciales permanecen exclusivamente en el servidor Next.js.

### Configuración

`config.example` documenta en alemán todos los ajustes disponibles. Cópialo como `config.yml`; este archivo local está excluido de Git. Los valores no válidos, las opciones desconocidas o los tipos incorrectos detienen el inicio del servidor con un error claro en vez de ignorarse silenciosamente.

Los ajustes disponibles incluyen:

- dirección y puerto de escucha
- idioma predeterminado para perfiles nuevos; el idioma elegido se guarda después en cada perfil
- modo `simple` para un usuario o `multiple` para la gestión de perfiles locales
- catálogo de demostración forzado
- límite de la portada, tamaño de los lotes y explicaciones de recomendaciones
- directorio, activadores y conservación de copias de seguridad
- nivel de registro, registro de solicitudes y archivo de registro opcional
- importación/exportación del perfil, proveedores, tráileres y títulos similares

Las credenciales y `DATABASE_URL` permanecen deliberadamente en `.env`. Los indicadores de funciones deshabilitan tanto la interfaz visible como las rutas de API o solicitudes externas relacionadas.

El modo predeterminado es el sencillo para un solo usuario:

```yaml
users:
  mode: "simple"
```

Con `mode: "multiple"` aparecen un selector de perfiles y una página de gestión. Cada usuario dispone de su propia caché multimedia, valoraciones, recomendaciones, lista, idioma, datos de importación/exportación y copias del perfil.

### Ejecutar como servicio local

Después de crear la compilación de producción, VidSelector puede ejecutarse como servicio de usuario de systemd:

```bash
npm run build
./scripts/install-service.sh
```

A continuación estarán disponibles los comandos habituales:

```bash
systemctl --user status vidselector
systemctl --user restart vidselector
journalctl --user -u vidselector -f
```

El servicio utiliza `server.host` y `server.port` de `config.yml` (`0.0.0.0:3000` de forma predeterminada), por lo que sigue disponible en `http://localhost:3000` y en `http://<IP-LAN-del-ordenador>:3000` dentro de la red doméstica de confianza.

### Caché local y almacenamiento de datos

| Contenido                       |         Conservación |
| ------------------------------- | -------------------: |
| Resultados de búsqueda          |             24 horas |
| Datos de detalles y proveedores |               7 días |
| Datos multimedia generales      |              30 días |
| Todo el contenido de TMDB       | 180 días como máximo |

Los datos multimedia caducados y sin uso se eliminan. Si un título sigue vinculado a una valoración personal, la valoración se conserva mientras que los metadatos caducados de TMDB se eliminan y se vuelven a obtener al solicitar los detalles. Así se conserva tu perfil sin guardar contenido de TMDB durante más de seis meses.

No se almacenan en Git:

- `.env` y las credenciales de API
- `config.yml` con los ajustes locales
- `prisma/dev.db` con los perfiles y las valoraciones
- artefactos de compilación, cobertura y pruebas
- `node_modules`
- copias locales en `backups/`

### Exportación, importación y copias de seguridad

En **Ajustes → Copia de seguridad** puedes exportar el nombre y el idioma del perfil, las valoraciones y la lista como archivo JSON versionado. La importación permite combinar o sustituir todos los datos. VidSelector crea una copia local adicional antes de importar o restablecer un perfil.

De forma predeterminada, `npm run db:push` también crea una copia coherente de SQLite antes de cada migración. El directorio, los activadores y la conservación se controlan mediante `config.yml`. Los valores predeterminados guardan diez copias de la base de datos, siete copias diarias de los perfiles y hasta cuatro estados semanales anteriores. Estos archivos nunca salen de tu ordenador.

## Desarrollo

### Controles de calidad

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

GitHub Actions ejecuta automáticamente linting, comprobación de tipos y formato, cobertura, compilación de producción y pruebas de navegador para escritorio y móvil.

### Arquitectura

```text
app/                    páginas Next.js y rutas API internas
components/             componentes React adaptables
lib/tmdb.ts             integración de TMDB en el servidor
lib/media-cache.ts      caché de consultas, contenido y detalles
lib/data.ts             persistencia Prisma y perfil local
lib/recommendations/    creación de perfil, clasificación y diversificación
lib/profile-transfer.ts formato versionado de exportación e importación
lib/profile-backups.ts  copias locales automáticas de perfiles
lib/config.mjs          configuración YAML validada
lib/i18n.ts             traducciones ampliables de la interfaz
prisma/                 esquema SQLite, migraciones y datos iniciales
tests/e2e/              pruebas de humo de Playwright
deploy/                 plantilla de servicio systemd
```

### Comandos

| Comando                 | Función                                             |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Iniciar el servidor de desarrollo                   |
| `npm run build`         | Crear una compilación de producción                 |
| `npm run start`         | Iniciar el servidor local de producción             |
| `npm run setup`         | Aplicar migraciones y añadir datos de ejemplo       |
| `npm run db:push`       | Aplicar migraciones de Prisma                       |
| `npm run db:backup`     | Crear una copia coherente de SQLite                 |
| `npm run db:migrate`    | Migrar sin el paso de copia adicional               |
| `npm run db:seed`       | Crear el perfil de ejemplo                          |
| `npm run lint`          | Ejecutar ESLint                                     |
| `npm run typecheck`     | Comprobar TypeScript                                |
| `npm test`              | Ejecutar pruebas unitarias, de API y componentes    |
| `npm run test:coverage` | Crear un informe de cobertura                       |
| `npm run test:e2e`      | Ejecutar pruebas de navegador en escritorio y móvil |
| `npm run format`        | Formatear archivos con Prettier                     |

## Contribuir

Las mejoras bien delimitadas y los informes de errores reproducibles son bienvenidos. Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de abrir un pull request, respeta [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) e informa de vulnerabilidades de forma privada según [`SECURITY.md`](SECURITY.md).

## Transparencia del desarrollo

VidSelector fue diseñado, implementado, probado y documentado con ayuda de IA generativa, especialmente **OpenAI Codex**. Las decisiones de arquitectura, la selección de cambios, la revisión técnica y la responsabilidad sobre la versión publicada corresponden al responsable del proyecto. El sistema de recomendaciones no utiliza IA generativa ni envía datos personales sobre tus gustos a ningún servicio de IA.

Todos los cambios publicados se documentan en [`CHANGELOG.md`](CHANGELOG.md).

## Fuentes de datos, marcas y avisos legales

This product uses the TMDB API but is not endorsed or certified by TMDB.

Los datos e imágenes de películas y series proceden de [The Movie Database (TMDB)](https://www.themoviedb.org). El logotipo de TMDB utilizado en la aplicación es oficial, no está modificado y aparece de forma menos destacada que la identidad de VidSelector.

La disponibilidad de streaming se ofrece a través de TMDB y procede de su colaboración con **JustWatch**. La disponibilidad puede cambiar; VidSelector enlaza a la página proporcionada por TMDB para obtener más información.

El uso de la API de TMDB está siempre sujeto a sus [condiciones de uso vigentes](https://www.themoviedb.org/api-terms-of-use). Cada persona que ejecute una instancia necesita sus propias credenciales de TMDB y es responsable de cumplir esas condiciones. Este proyecto no está destinado al uso comercial, que puede requerir un acuerdo escrito independiente con TMDB.

VidSelector no proporciona películas, series ni transmisiones. Todas las marcas, títulos, imágenes y demás contenidos pertenecen a sus respectivos propietarios.

## Licencia

El código fuente puede consultarse públicamente, pero no tiene una licencia de código abierto. Se aplica [`LICENSE.md`](LICENSE.md): **Todos los derechos reservados**.

Copyright © 2026 DevMatze.
