# Contribuir a OpenPapers

¡Gracias por tu interés en contribuir a OpenPapers! Toda ayuda es bienvenida.

## Cómo contribuir

### Reportar errores

1. Verifica que el error no haya sido reportado previamente en [Issues](../../issues).
2. Crea un nuevo issue usando la plantilla **Bug Report**.
3. Incluye pasos para reproducir, comportamiento esperado y real, y capturas de pantalla si aplica.

### Sugerir funcionalidades

1. Abre un issue con la plantilla **Feature Request**.
2. Describe el problema que resuelve y la solución propuesta.

### Pull Requests

1. Haz fork del repositorio.
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feat/mi-funcionalidad
   ```
3. Realiza tus cambios siguiendo las convenciones del proyecto.
4. Verifica que el build pase:
   ```bash
   cd frontend && npm run build
   ```
5. Haz commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: agregar validación de archivo por magic bytes
   fix: corregir filtro de búsqueda en submissions
   docs: actualizar README con nuevas variables de entorno
   ```
6. Abre un Pull Request contra `main` usando la plantilla proporcionada.

## Convenciones de código

### General

- Indentación: **2 espacios** (sin tabs).
- Comillas simples en JavaScript.
- Punto y coma al final de cada sentencia.
- Nombres de variables y funciones en **camelCase**.
- Archivos de componentes React en **PascalCase**.

### Backend

- Rutas en `src/routes/`, nombradas como `*.routes.js`.
- Validación con **Zod** en cada endpoint que recibe datos.
- Errores con clases de `src/utils/errors.js` (`NotFoundError`, `ValidationError`, etc.).
- Consultas SQL con prepared statements (nunca concatenar parámetros).

### Frontend

- Componentes funcionales con hooks.
- Estado global con `useContext` + `useReducer` (AuthContext).
- Estilos con **Tailwind CSS** (no CSS custom salvo excepciones justificadas).
- Textos de UI en **español** con acentos correctos.

## Entorno de desarrollo

```bash
# Backend (puerto 3001)
cd backend && npm install && npm run dev

# Frontend (puerto 5173)
cd frontend && npm install && npm run dev
```

## Código de conducta

Al participar en este proyecto aceptas el [Código de Conducta](CODE_OF_CONDUCT.md).

## Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la [Licencia MIT](LICENSE).
