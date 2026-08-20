# Evaluación final Módulo 7

Aplicación sencilla para administrar países, población, PIB y acciones realizadas sobre los registros.

## Requisitos

- Node.js instalado.
- PostgreSQL instalado y ejecutándose.
- Una base de datos llamada `paises_evaluacion`.
- Visual Studio Code con Live Server.

## Instalación con Git Bash

Desde la carpeta del proyecto, ejecuta:

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` y escribe la contraseña de tu usuario de PostgreSQL.

## Preparar las tablas

El seeder crea y carga las tres tablas solicitadas:

- `paises`: nombre, continente y población.
- `paises_pib`: PIB 2019 y PIB 2020.
- `paises_data_web`: país y acción realizada.

```bash
cd backend
node src/seeders/seed.js
```

El seeder elimina los datos anteriores y vuelve a crear las tablas. Úsalo antes de una demostración si necesitas regresar a los datos iniciales.

## Ejecutar el backend

La API utiliza el puerto `3501`, porque el puerto `3500` presentaba conflicto en el entorno de ejecución:

```bash
cd backend
node app.js
```

La consola debe mostrar:

```text
Servidor iniciado en http://localhost:3501
Conexión a PostgreSQL establecida correctamente.
```

Se usa `node app.js` para iniciar directamente el servidor.

## Ejecutar el frontend

1. Mantén el backend ejecutándose.
2. Abre `frontend/index.html` en Visual Studio Code.
3. Haz clic derecho y selecciona **Open with Live Server**.
4. Abre la interfaz en `http://localhost:5500/index.html` o en el puerto que indique Live Server.

La interfaz del trabajo es:

```text
http://localhost:5500/index.html
```

La API que usa el frontend es:

```text
http://localhost:3501/paises
```

No abras `/paises` para usar los formularios: esa dirección devuelve solamente la respuesta JSON de la API.

Live Server solo sirve el frontend. PostgreSQL y el backend deben estar activos para usar GET, POST y DELETE.

## Funcionalidades de la evaluación

### GET

Muestra nombre, continente, población, PIB 2019 y PIB 2020. El usuario puede seleccionar `5`, `10` o `20` registros y avanzar con **Siguiente**.

```text
GET http://localhost:3501/paises?page=1&limit=5
GET http://localhost:3501/paises?page=2&limit=10
GET http://localhost:3501/paises?page=1&limit=20
```

El backend utiliza `pg-cursor` para entregar los registros por bloques.

### POST

Agrega un país en `paises` y `paises_pib`, y registra la acción `1` en `paises_data_web` dentro de una transacción.

Para probarlo desde el formulario usa un país que no esté en los datos iniciales:

```json
{
  "nombre": "Colombia",
  "continente": "America",
  "poblacion": 52000000,
  "pib_2019": 6500,
  "pib_2020": 5300
}
```

Solicitud directa:

```text
POST http://localhost:3501/paises
Content-Type: application/json
```

### DELETE

Elimina el país de `paises` y `paises_pib`, y registra la acción `0` en `paises_data_web` dentro de una transacción.

```text
DELETE http://localhost:3501/paises/Colombia
```

## Probar las API desde Git Bash

Con el backend ejecutándose:

```bash
curl "http://localhost:3501/paises?page=1&limit=5"
curl "http://localhost:3501/paises?page=2&limit=10"

curl -X POST "http://localhost:3501/paises" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Colombia","continente":"America","poblacion":52000000,"pib_2019":6500,"pib_2020":5300}'

curl -X DELETE "http://localhost:3501/paises/Colombia"
```

## Verificación de requisitos

- El GET entrega la lista completa por páginas.
- Solo acepta límites `5`, `10` y `20`.
- El POST agrega datos en las dos tablas principales y registra acción `1`.
- El DELETE elimina datos relacionados y registra acción `0`.
- POST y DELETE usan `BEGIN`, `COMMIT` y `ROLLBACK`.
- Los errores del backend aparecen ordenados dentro del frontend.
- Las solicitudes que demoran más de 10 segundos se cancelan para que la interfaz no quede bloqueada.
