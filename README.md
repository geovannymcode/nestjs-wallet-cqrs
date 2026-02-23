# Proyecto: nestjs-fintech-clean

Estructura base del proyecto utilizando NestJS, arquitectura limpia y enfoque orientado a fintech.

```
nestjs-fintech-clean/
├── docker-compose.yml             # Configuración de servicios Docker (DB, Redis, etc.)
├── package.json                   # Dependencias del proyecto y scripts de npm
├── tsconfig.json                  # Configuración de TypeScript
├── nest-cli.json                  # Configuración del CLI de NestJS
├── README.md                      # Documentación del proyecto
├── .env                           # Variables de entorno
├── examples/
│   └── 1-spaghetti-code.ts        # Ejemplo de código no estructurado (anti-patrón)
├── scripts/
│   └── init-db.sql                # Script de inicialización de la base de datos
└── src/
    ├── main.ts                    # Punto de entrada de la aplicación NestJS
    ├── app.module.ts              # Módulo raíz de la aplicación
    └── modules/
        └── disbursement/          # Módulo de desembolsos
            ├── domain/
            │   └── entities/      # Entidades del dominio (Enterprise Business Rules)
            ├── application/
            │   ├── use-cases/     # Casos de uso (Application Business Rules)
            │   ├── commands/      # Comandos CQRS
            │   └── queries/       # Consultas CQRS
            ├── infrastructure/
            │   ├── repositories/  # Implementaciones técnicas de acceso a datos
            │   └── services/      # Servicios externos (APIs, integraciones)
            └── presentation/
                ├── controllers/   # Controladores HTTP (Interfaces de entrada)
                └── dto/           # Objetos de transferencia de datos (Request/Response)
```

> Esta estructura sigue los principios de Clean Architecture, donde las capas están claramente separadas y los módulos de dominio, aplicación, infraestructura y presentación tienen responsabilidades bien definidas.
