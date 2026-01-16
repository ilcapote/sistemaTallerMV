# Taller MV - Sistema de Gestión de Taller Mecánico

Aplicación web moderna para gestionar un taller mecánico. Permite administrar turnos, clientes, vehículos y repuestos.

## Características

- 📅 **Calendario de Turnos**: Vista mensual con indicadores de estado por colores
  - 🟡 Amarillo: Pendiente
  - 🔵 Azul: En Progreso
  - 🟢 Verde: Completado
- 👥 **Gestión de Clientes**: Registro con datos básicos (nombre, teléfono, email, dirección)
- 🚗 **Gestión de Vehículos**: Múltiples vehículos por cliente (patente, marca, modelo, año, color)
- 📦 **Control de Repuestos**: Stock con alertas de stock bajo
- 📱 **Diseño Mobile-First**: Optimizado para celulares
- 📤 **Compartir Turnos**: Genera imagen del turno para enviar por WhatsApp

## Flujo de Trabajo

1. **Nuevo Turno**: Seleccionar cliente → Seleccionar vehículo → Describir trabajo
2. **Iniciar Turno**: Cambia estado a "En Progreso"
3. **Agregar Trabajos**: Lista de trabajos con precios
4. **Finalizar Turno**: Cambia estado a "Completado"
5. **Compartir**: Genera imagen con resumen del turno

## Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Estilos**: Tailwind CSS, shadcn/ui
- **Base de Datos**: Prisma + SQLite (fácil migrar a PostgreSQL)
- **Iconos**: Lucide React

## Instalación

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma y crear base de datos
npm run db:push

# Iniciar servidor de desarrollo
npm run dev
```

## Despliegue en Vercel (Gratis)

1. Subir el proyecto a GitHub
2. Conectar el repositorio en [vercel.com](https://vercel.com)
3. Configurar variable de entorno:
   - `DATABASE_URL`: URL de base de datos PostgreSQL (puedes usar [Neon](https://neon.tech) o [Supabase](https://supabase.com) gratis)
4. Desplegar

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/           # API Routes
│   │   ├── clientes/
│   │   ├── vehiculos/
│   │   ├── repuestos/
│   │   ├── turnos/
│   │   └── stats/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/            # Componentes base (shadcn/ui)
│   ├── turnos/        # Componentes de turnos
│   ├── clientes/      # Componentes de clientes
│   ├── vehiculos/     # Componentes de vehículos
│   └── repuestos/     # Componentes de repuestos
├── lib/
│   ├── prisma.ts      # Cliente Prisma
│   └── utils.ts       # Utilidades
└── prisma/
    └── schema.prisma  # Esquema de base de datos
```

## Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Iniciar servidor de producción
- `npm run db:push` - Sincronizar esquema con base de datos
- `npm run db:studio` - Abrir Prisma Studio (UI para base de datos)
