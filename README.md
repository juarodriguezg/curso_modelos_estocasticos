# 📊 Curso de Modelos Estocásticos

Aplicación web interactiva desarrollada en **Next.js 14**, diseñada para gestionar y presentar el contenido del curso **Modelos Estocásticos y Simulación en Computación y Comunicaciones**.  
Incluye autenticación de usuarios, roles (Administrador, Profesor, Estudiante), carga de materiales y gestión centralizada del contenido.

---

## 🚀 Tecnologías utilizadas

| Tecnología | Descripción |
|-------------|--------------|
| **Next.js 14 (App Router)** | Framework React para renderizado híbrido y rutas modernas. |
| **TypeScript** | Tipado estático para mayor robustez y escalabilidad. |
| **Prisma ORM** | Interfaz ORM para conexión con la base de datos PostgreSQL. |
| **PostgreSQL** | Base de datos relacional para almacenar usuarios y sesiones. |
| **Tailwind CSS** | Estilos y diseño adaptativo usando variables personalizadas. |
| **Lucide React** | Iconografía limpia y ligera. |
| **JWT + Cookies HTTPOnly** | Mecanismo seguro de autenticación y persistencia de sesión. |

---

## 🧱 Estructura del proyecto

curso_modelos_estocasticos/
├── prisma/
│ ├── schema.prisma # Esquema de la base de datos
├── src/
│ ├── app/
│ │ ├── login/ # Página de inicio de sesión
│ │ ├── perfil/ # Perfil de usuario
│ │ ├── temas/ # Secciones del curso
│ │ └── api/
│ │ ├── auth/ # Rutas API para login/logout/usuario
│ ├── components/ # Componentes reutilizables
│ ├── lib/ # Configuración de Prisma y utilidades
│ └── styles/ # Archivos de estilo globales
└── public/
├── Fondo_Tlon.png # Imagen de fondo del home
├── documentos/ # Materiales PDF del curso


---

## ⚙️ Configuración e instalación

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tuusuario/curso_modelos_estocasticos.git
cd curso_modelos_estocasticos

npm install

Scripts disponibles

| Comando                  | Descripción                             |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Ejecuta el servidor en modo desarrollo  |
| `npm run build`          | Genera el build de producción           |
| `npm start`              | Ejecuta el servidor en modo producción  |
| `npx prisma studio`      | Abre el panel visual de Prisma          |
| `npx prisma migrate dev` | Aplica las migraciones de base de datos |

🧾 Licencia

Proyecto académico bajo licencia MIT.
Desarrollado para el Departamento de Ingeniería de Sistemas e Industrial — Universidad Nacional de Colombia.

Desarrollado por juarodriguezg
