# TPDSW-backend-Proyecto Kicket

Backend del proyecto **Kicket**, una plataforma para la gestión y venta
de entradas para eventos deportivos.\
Incluye autenticación basada en roles, gestión completa de entidades,
procesamiento de pagos mediante **Mercado Pago** y generación automática
de entradas con código QR.

## 📋 Tabla de Contenidos

-   [✨ Características Principales](#-características-principales)\
-   [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)\
-   [🚀 Instalación y Ejecución](#-instalación-y-ejecución)
    -   [Pre-requisitos](#pre-requisitos)\
    -   [Variables de Entorno](#variables-de-entorno)\
    -   [Pasos de Instalación](#pasos-de-instalación)\
-   [📂 Estructura del Proyecto](#-estructura-del-proyecto)\
-   [🔗 Rutas de la API (Endpoints)](#-rutas-de-la-api-endpoints)
    -   [Autenticación](#autenticación)\
    -   [Usuarios](#usuarios)\
    -   [Clubes](#clubes)\
    -   [Estadios](#estadios)\
    -   [Eventos](#eventos)\
    -   [Sectores](#sectores)\
    -   [Precios](#precios)\
    -   [Pagos y Entradas](#pagos-y-entradas)\
-   [📦 Modelo de Datos (Entidades)](#-modelo-de-datos-entidades)

## ✨ Características Principales

-   **Autenticación y Autorización:**\
    Sistema de registro e inicio de sesión con **JWT** y manejo de roles
    (`user`, `admin`).\
    Protección de rutas con Passport y middlewares.

-   **Gestión de Entidades (Admin):**\
    CRUDs protegidos para la administración de Clubes, Estadios,
    Sectores, Eventos y Precios.

-   **Proceso de Compra:**\
    Integración con la **SDK de Mercado Pago**, generación de
    preferencias de pago y manejo del flujo de compra.

-   **Generación Automática de Entradas:**\
    Creación de *Entradas* con **código QR único** utilizando `qrcode`,
    tras la confirmación del pago.

-   **Webhook de Pagos:**\
    Endpoint en `/api/pagos/webhook` para recibir notificaciones y
    actualizar automáticamente el estado de las compras.

-   **Validación de Datos:**\
    Validación robusta con **Zod** para los endpoints de autenticación y
    otras rutas.

## 🛠️ Tecnologías Utilizadas

  Categoría              Tecnología
  ---------------------- ------------------------------------------------
  **Runtime**            Node.js
  **Framework**          Express.js
  **Lenguaje**           TypeScript
  **Base de Datos**      MySQL
  **ORM**                MikroORM (v6)
  **Autenticación**      jsonwebtoken, passport, passport-jwt, bcryptjs
  **Pagos**              Mercado Pago SDK (`mercadopago`)
  **Validación**         Zod
  **Generación de QR**   qrcode
  **Paquetería**         pnpm
  **Otros**              cors, compression, dotenv

## 🚀 Instalación y Ejecución

### Pre-requisitos

-   Node.js (\>= 18)\

-   MySQL\

-   pnpm instalado globalmente:

    ``` bash
    npm install -g pnpm
    ```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con:

    PORT=3000
    NODE_ENV=development

    DATABASE_HOST=localhost
    DATABASE_PORT=3306
    DATABASE_USER=root
    DATABASE_PASSWORD=tu_password
    DATABASE_NAME=kicket_db

    JWT_SECRET=tu_clave_secreta

    MERCADOPAGO_ACCESS_TOKEN=tu_access_token
    MERCADOPAGO_WEBHOOK_URL=https://tu-dominio/api/pagos/webhook

### Pasos de Instalación

``` bash
git clone <url-del-repo>
cd TPDSW-backend
pnpm install
pnpm mikro-orm migration:up
pnpm dev
```

## 📂 Estructura del Proyecto

    src/
     ├─ config/
     ├─ controllers/
     ├─ entities/
     ├─ middlewares/
     ├─ routes/
     ├─ services/
     ├─ utils/
     ├─ app.ts
     └─ server.ts

## 🔗 Rutas de la API (Endpoints)

### Autenticación

-   POST /api/auth/register
-   POST /api/auth/login

### Usuarios

-   GET /api/usuarios
-   GET /api/usuarios/:id
-   PUT /api/usuarios/:id

### Clubes

-   GET /api/clubes
-   POST /api/clubes

### Estadios

-   GET /api/estadios
-   POST /api/estadios

### Eventos

-   GET /api/eventos
-   POST /api/eventos

### Sectores

-   GET /api/sectores
-   POST /api/sectores

### Precios

-   GET /api/precios
-   POST /api/precios

### Pagos y Entradas

-   POST /api/pagos/crear-preferencia
-   POST /api/pagos/webhook
-   GET /api/entradas/:id

## 📦 Modelo de Datos (Entidades)

-   Usuario\
-   Club\
-   Estadio\
-   Sector\
-   Evento\
-   Precio\
-   Pago\
-   Entrada
