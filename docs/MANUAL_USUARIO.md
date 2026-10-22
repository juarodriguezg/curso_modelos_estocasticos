# Manual de usuario — Curso de Modelos Estocásticos (plataforma web)

Esta guía explica cómo usar la plataforma según el tipo de cuenta: **estudiante**, **profesor** o **administrador**.

## 1. Acceso a la plataforma

1. Ingresa a la página principal del curso.
2. Si ya tienes cuenta, haz clic en **"Iniciar sesión"** (esquina superior derecha) e ingresa tu correo y contraseña.
3. Si no tienes cuenta, un administrador debe crearla (individualmente o mediante carga masiva por CSV). No hay registro público abierto habilitado en la interfaz actual, aunque existe la ruta de auto-registro a nivel técnico.
4. Tras iniciar sesión, serás redirigido a la página principal, donde verás tu nombre y un botón de acceso al **Perfil**.

### Cerrar sesión
Desde la página principal o desde tu Perfil, haz clic en el botón de salida (ícono de flecha/"Salir"). Esto cierra tu sesión en todos los dispositivos donde uses ese mismo token.

## 2. Navegación por el contenido del curso

- El **menú lateral** (ícono ☰) muestra la estructura del curso organizada en **Partes → Secciones → Subtemas**.
- Haz clic en una Parte para desplegar sus secciones, y en una sección con subtemas para ver sus subsecciones.
- Solo verás los temas que el administrador haya marcado como visibles para tu grupo (Grupo 1 o Grupo 2). Si un tema no aparece, puede que aún no esté habilitado para tu grupo.
- Dentro de cada tema encontrarás, según lo que el administrador haya publicado:
  - **Texto explicativo.**
  - **Video incrustado.**
  - **Material descargable** (botón "Descargar Material").
  - **Tareas y enlaces relacionados.**
- El botón de **modo claro/oscuro** está en la parte superior del menú lateral.

## 3. Perfil de usuario

En **Perfil** puedes ver:
- Tu nombre, correo, rol (Estudiante/Profesor/Administrador) y, si aplica, tu grupo asignado.

Los estudiantes y profesores no tienen opciones adicionales en esta pantalla salvo el cierre de sesión y el cambio de tema claro/oscuro.

## 4. Panel de administración (solo administradores)

Al entrar a **Perfil** con una cuenta de administrador, aparece la sección **"Panel de Administración"** con tres pestañas.

### 4.1 Pestaña "Cargar CSV"
Permite crear estudiantes en bloque a partir de un archivo CSV.

**Formato requerido del archivo** (columnas, en este orden de nombres):
```
No, Apellidos, Nombre, Documento, Correo, Grupo
```
- `Grupo` debe ser `1` o `2`.
- La **contraseña inicial** de cada estudiante creado será su número de **Documento**. Comunícales esto para que puedan iniciar sesión (actualmente la plataforma no ofrece un flujo de "olvidé mi contraseña" ni de cambio de contraseña).
- Filas con correo o documento vacío, grupo inválido, o correo ya registrado se omiten; al finalizar la carga se muestra cuántos usuarios se crearon y, si hubo filas omitidas, un aviso con el detalle.

Pasos:
1. Selecciona el archivo CSV con el botón de carga.
2. Haz clic en **"Procesar CSV"**.
3. Revisa el mensaje de resultado (creados / omitidos / errores).

### 4.2 Pestaña "Usuarios"
Lista todos los usuarios registrados.
- Haz clic en **"Actualizar"** para refrescar la lista.
- Para eliminar un usuario, haz clic en **"Eliminar"** junto a su nombre y confirma. Esta acción es irreversible y borra también sus sesiones activas.
- No es posible eliminar tu propia cuenta desde aquí.

### 4.3 Pestaña "Visibilidad"
Controla qué temas ve cada grupo de estudiantes y permite crear temas nuevos.

**Ver/editar visibilidad:**
- Los temas se agrupan por "Parte"; haz clic en el nombre de una parte para desplegarla.
- Cada tema (y sus subtemas, indentados) muestra dos botones: **G1** y **G2**.
  - Azul/activo = visible para ese grupo. Gris/inactivo = oculto para ese grupo.
  - Haz clic en el botón para alternar la visibilidad del tema para ese grupo específico.

**Sincronizar:**
- El botón **"Sincronizar"** actualiza la lista de temas contra el temario oficial del curso: crea los temas que falten y actualiza el título/orden de los existentes. Útil tras cambios en el temario hechos por el equipo de desarrollo. No borra temas existentes.

**Crear un tema nuevo:**
1. Haz clic en **"+ Crear Tema"**.
2. Escribe el **título**; el campo de **slug** (identificador para la URL) se genera automáticamente, pero puedes editarlo.
3. Opcionalmente, selecciona una **Parte** existente o escribe el nombre de una nueva.
4. Opcionalmente, selecciona un **tema padre** si este nuevo tema debe aparecer como subtema de otro.
5. Haz clic en **"Guardar Tema"**.

**Editar el contenido de un tema:**
- Junto a cada tema en la lista hay un botón **"Contenido"** que abre el editor de ese tema (`/perfil/tema/[id]`).
- Desde ahí puedes:
  - Cambiar el **título** del tema (el slug/URL no es editable desde la interfaz, para no romper enlaces existentes).
  - Añadir bloques de contenido con los botones **"+ Texto"**, **"+ Video"**, **"+ PDF/Material"**:
    - *Texto*: cuadro de texto libre. Admite HTML básico y **fórmulas LaTeX**: escribe `$formula$` para una fórmula en línea (ej. `$x^2$`) o `$$formula$$` para una fórmula en bloque, centrada (ej. `$$E[X] = \sum x_i p_i$$`).
    - *Video*: URL de **embed** reproducible en un iframe. Funciona con YouTube (formato `https://www.youtube.com/embed/...`) o con Google Drive (formato `https://drive.google.com/file/d/ID_DEL_ARCHIVO/preview`, **no** el enlace normal "Ver"/`view`). Si usas Drive, el archivo debe compartirse como "Cualquier persona con el enlace" — si requiere iniciar sesión con una cuenta específica, el video no se reproducirá dentro de la página.
    - *Material*: URL del archivo PDF u otro material (por ejemplo, `/documents/archivo.pdf`).
  - Eliminar un bloque de contenido con el ícono de papelera.
  - Añadir/eliminar **enlaces y tareas** (título + URL) en la sección correspondiente.
  - Al terminar, haz clic en **"Guardar Cambios"**. Esto **reemplaza por completo** los bloques de contenido y enlaces existentes del tema por los que aparecen en pantalla en ese momento — revisa que todos los bloques que quieras conservar sigan visibles antes de guardar.

## 5. Preguntas frecuentes

**¿Por qué no veo un tema que un compañero de otro grupo sí ve?**
Los temas pueden habilitarse de forma independiente para Grupo 1 y Grupo 2. Consulta con el administrador si crees que debería estar visible para tu grupo.

**Olvidé mi contraseña, ¿cómo la recupero?**
Actualmente no existe un flujo de autoservicio para restablecer contraseña. Contacta al administrador del curso para que la restablezca manualmente (creando de nuevo el usuario o mediante acceso directo a la base de datos).

**Subí el CSV y algunos estudiantes no se crearon, ¿por qué?**
Revisa el mensaje de errores que se muestra tras la carga: las causas más comunes son correo o documento vacíos, un valor de grupo distinto de 1 o 2, o un correo que ya existe en el sistema.

**¿Puedo deshacer la eliminación de un usuario o de contenido de un tema?**
No. Tanto la eliminación de usuarios como el guardado de cambios en el editor de temas son operaciones definitivas; no hay papelera ni historial de versiones.
