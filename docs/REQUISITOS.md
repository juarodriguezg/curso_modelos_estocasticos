# Especificación de Requisitos del Sistema

**Proyecto:** Curso de Modelos Estocásticos y Simulación en Computación y Comunicaciones
**Documento de origen:** `docs/requisitos.pdf`
**Versión:** 1.1
**Estado:** Borrador para validación
**Fecha:** 5 de noviembre de 2026

---

## 1. Propósito

Este documento formaliza los requisitos funcionales y no funcionales del sistema de gestión del curso, a partir del documento de requisitos entregado. Su objetivo es servir como referencia única y verificable para el diseño, la implementación, la validación y la aceptación del sistema.

## 2. Alcance

El sistema es una plataforma web de gestión académica que permite administrar asignaturas, cursos, temarios, material bibliográfico, lecturas, tareas, evaluaciones, asistencia y la bolsa de bonos de los estudiantes. El acceso a las funcionalidades depende del rol del usuario autenticado.

### 2.1 Definiciones del modelo académico

| Término | Definición |
|---|---|
| **Asignatura** | Entidad padre del modelo académico. Corresponde al catálogo de la asignatura y contiene su nombre, código, créditos, objetivo, objetivos específicos y temario (temas y contenidos). No está ligada a un periodo académico. |
| **Curso** | Instancia de una asignatura en un periodo académico específico, identificada por un grupo o sección. Hereda del periodo sus fechas de inicio y finalización. Los estudiantes, calificaciones, bonos, lecturas, tareas, evaluaciones y asistencias se asocian al curso, no directamente a la asignatura. Un curso puede estar **activo** o **finalizado**. |
| **Tema** | Unidad del temario que pertenece a una asignatura. |
| **Contenido** | Elemento que pertenece a un tema y describe o referencia un recurso del mismo. |
| **Tarea** | Actividad definida a nivel de asignatura. Se habilita en uno o varios cursos, y es en el curso donde adquiere fechas de desbloqueo y vencimiento, archivos y calificaciones. |

> Esta distinción es estructural: una asignatura puede ofrecerse en varios cursos o periodos académicos, y cada curso mantiene su propia población estudiantil, calendario y registros académicos.

## 3. Actores

| Actor | Descripción | Permisos generales |
|---|---|---|
| **Administrador (Profesor)** | Usuario responsable de la gestión general de la plataforma. El rol Profesor comparte el mismo nivel de permisos. | Permisos de creación, edición, consulta y eliminación sobre la información académica y de configuración. |
| **Monitor** | Estudiante auxiliar con permisos elevados dentro de los cursos en los que está matriculado. | Consulta de puntos acumulados, registro y edición de bonos, registro y edición de asistencia, y consulta de calificaciones de sus cursos matriculados. No puede modificar calificaciones. |
| **Estudiante** | Usuario vinculado a uno o más cursos. | Consulta de la información del curso y aceptación o rechazo de asignaciones de lectura. |

> El rol Monitor es una designación sobre un usuario con rol base Estudiante; no constituye un tipo de usuario independiente.

---

## 4. Requisitos funcionales

La nomenclatura utilizada es `RF-<MÓDULO>-<NÚMERO>`. Cada requisito indica el actor responsable y la funcionalidad esperada.

### 4.1 Módulo de gestión de asignaturas

| ID | Actor | Requisito |
|---|---|---|
| **RF-ASG-01** | Administrador | El sistema deberá permitir registrar una asignatura mediante un formulario con los campos: nombre de la asignatura, código, créditos, objetivo y objetivos específicos. El código deberá ser único en la plataforma. |
| **RF-ASG-02** | Administrador | El sistema deberá permitir crear, editar y eliminar los temas de una asignatura mediante un formulario cuyo campo obligatorio será el nombre del tema. |
| **RF-ASG-03** | Administrador | El sistema deberá permitir agregar, editar y eliminar contenidos asociados a un tema específico mediante un formulario en el que se seleccione el tema y se ingrese el nombre del contenido, un texto explicativo y los recursos asociados (archivos o enlaces). |
| **RF-ASG-04** | Administrador | El sistema deberá permitir editar una asignatura y eliminarla únicamente cuando no tenga cursos activos. La eliminación requerirá confirmación explícita y borrará en cascada los cursos finalizados asociados. |
| **RF-ASG-05** | Sistema | El sistema deberá heredar automáticamente en cada curso el temario de la asignatura, sin duplicar temas ni contenidos. La fecha de publicación de cada tema se definirá por curso. |
| **RF-ASG-06** | Administrador | El sistema deberá permitir reordenar los temas de una asignatura y los contenidos de cada tema. |

### 4.2 Módulo de gestión de la biblioteca digital

| ID | Actor | Requisito |
|---|---|---|
| **RF-BIB-01** | Administrador | El sistema deberá permitir crear, editar y eliminar materiales de la biblioteca digital mediante un formulario con los campos: nombre del material, autor, categoría y enlace de acceso o archivo subido, de modo que el material cuente al menos con un enlace o un archivo. |
| **RF-BIB-02** | Administrador | El sistema deberá permitir crear, editar y eliminar asociaciones entre un material de la biblioteca y uno o varios temas del temario. La operación deberá estar disponible tanto desde la sección individual del material como desde la sección individual del tema. |
| **RF-BIB-03** | Administrador | El sistema deberá disponer de un catálogo global y administrable de categorías de materiales, reutilizable por todos los cursos. |
| **RF-BIB-04** | Sistema | El estudiante solo podrá ver los materiales asociados a los temas de las asignaturas de sus cursos y los enlazados desde sus tareas. |

### 4.3 Módulo de gestión de cursos y usuarios

| ID | Actor | Requisito |
|---|---|---|
| **RF-CUR-01** | Administrador | El sistema deberá permitir registrar un curso, entendido como una asignatura ofrecida en un periodo académico específico, mediante un formulario con los campos: asignatura, periodo académico y grupo o sección. Las fechas de inicio y finalización del curso se heredarán del periodo académico seleccionado. |
| **RF-CUR-02** | Administrador | El sistema deberá permitir crear, editar y desactivar el listado de estudiantes asociado a un curso mediante un formulario con los campos: nombre, apellido, correo electrónico y documento de identificación. Al registrar un estudiante, el sistema deberá crear su cuenta si no existe o reutilizarla si ya existe, y matricularlo en el curso. El correo electrónico deberá ser único por usuario y un estudiante no podrá matricularse dos veces en el mismo curso. |
| **RF-CUR-03** | Administrador | El sistema deberá permitir establecer una fecha de publicación informativa para cada material, tema y tarea asociados a un curso. Esta fecha no restringirá el acceso al contenido. |
| **RF-CUR-04** | Administrador | Al desactivar la matrícula de un estudiante en un curso, el sistema deberá conservar su cuenta, sus calificaciones, bonos y demás historial. La cuenta podrá seguir activa en otros cursos. |
| **RF-CUR-05** | Sistema / Administrador | El sistema deberá finalizar automáticamente un curso al superar la fecha final de su periodo académico. El Administrador también deberá poder finalizarlo manualmente antes de esa fecha. |
| **RF-CUR-06** | Sistema | La combinación asignatura, periodo académico y grupo o sección deberá ser única. |
| **RF-CUR-07** | Sistema | El sistema deberá validar que la fecha de inicio del periodo académico sea anterior a su fecha final y advertir, sin bloquear el guardado, cuando una fecha de publicación, desbloqueo o vencimiento quede fuera del rango del periodo. |
| **RF-CUR-08** | Sistema / Administrador | Un curso finalizado quedará en modo de solo lectura, conservando todos sus datos. El Administrador podrá reactivarlo de forma explícita. |
| **RF-CUR-09** | Administrador | El sistema deberá permitir exportar la información de un curso finalizado en formato Excel (.xlsx) y, tras la exportación, purgar sus datos con una confirmación explícita. |
| **RF-CUR-10** | Administrador | El sistema deberá permitir crear y editar periodos académicos con nombre, fecha de inicio y fecha final. |
| **RF-CUR-11** | Administrador | El sistema deberá permitir editar un curso activo y eliminarlo únicamente cuando no tenga estudiantes ni registros académicos asociados. |

### 4.4 Módulo de gestión de la bolsa de bonos

| ID | Actor | Requisito |
|---|---|---|
| **RF-BON-01** | Administrador / Monitor | El sistema deberá mostrar un listado de los puntos acumulados por cada estudiante. |
| **RF-BON-02** | Administrador / Monitor | El sistema deberá permitir registrar puntos a un estudiante mediante un formulario con los campos: número de puntos, fecha de los puntos y concepto de los puntos. El número de puntos deberá ser un entero positivo. |
| **RF-BON-03** | Administrador / Monitor | El sistema deberá disponer de un catálogo global y administrable de conceptos de bonos, reutilizable por todos los cursos. No existirá un límite fijo de diez conceptos: podrán crearse más según se requiera. Si el concepto no existe en el catálogo, se seleccionará «Otro» y se registrará una descripción libre en el bono. |
| **RF-BON-04** | Administrador / Monitor | El Monitor y el Administrador deberán poder editar o eliminar un bono registrado. Toda modificación deberá conservar trazabilidad del usuario, la fecha y el valor anterior. |

### 4.5 Módulo de gestión de lecturas

| ID | Actor | Requisito |
|---|---|---|
| **RF-LEC-01** | Administrador | El sistema deberá permitir asociar un libro de la biblioteca digital a uno o varios cursos. Cada curso podrá tener una única lectura asignada. |
| **RF-LEC-02** | Administrador | El sistema deberá permitir agregar los capítulos correspondientes a un libro mediante un formulario con los campos: nombre del capítulo, página inicial y página final. Los capítulos pertenecen al libro y se reutilizan en todos los cursos donde se asigne. |
| **RF-LEC-03** | Sistema / Administrador | Para cada capítulo de una lectura asignada a un curso, el sistema deberá generar una lista ordenada de tres (3) estudiantes candidatos mediante sorteo aleatorio uniforme entre los estudiantes elegibles: la primera posición se sorteará entre quienes no hayan ocupado la primera posición, la segunda entre quienes no hayan ocupado la segunda y la tercera entre quienes no hayan ocupado la tercera, sin repetir estudiantes dentro de la misma lista. Un estudiante no podrá volver a ser candidato hasta que todos los estudiantes matriculados en el curso hayan sido candidatos al menos una vez. |
| **RF-LEC-04** | Estudiante | El sistema deberá permitir al estudiante aceptar su asignación de lectura únicamente cuando ocupe la primera posición de la lista y su turno esté vigente. |
| **RF-LEC-05** | Estudiante | El sistema deberá permitir al estudiante rechazar o invalidar su asignación a un capítulo específico. |
| **RF-LEC-06** | Sistema / Estudiante | Si los tres candidatos rechazan el capítulo o dejan vencer su plazo, el capítulo quedará vacante y abierto durante las siguientes veinticuatro (24) horas, contadas incluso si no son hábiles, para que cualquier estudiante matriculado en el curso pueda aceptarlo. Si nadie lo acepta, el capítulo se cerrará. |
| **RF-LEC-07** | Administrador | El sistema deberá permitir al Administrador generar y publicar manualmente la lista de candidatos de cada capítulo. Los plazos de respuesta comenzarán a contar en el momento de la publicación. |
| **RF-LEC-08** | Sistema | Si un candidato rechaza antes de su plazo, el turno del siguiente candidato se habilitará de inmediato, conservando la fecha límite original que le corresponde. |

> Para RF-LEC-03, un estudiante es elegible mientras tenga matrícula activa en el curso y no haya sido candidato en el ciclo vigente. El ciclo se reinicia cuando todos los estudiantes matriculados hayan sido candidatos al menos una vez. Aceptar un capítulo no excluye al estudiante de futuras listas; se le aplica la misma regla de equidad.

### 4.6 Módulo de gestión de tareas

| ID | Actor | Requisito |
|---|---|---|
| **RF-TAR-01** | Administrador | El sistema deberá permitir registrar una tarea asociada a una asignatura mediante un formulario con los campos: nombre de la tarea, enunciado de la tarea y enlace a un medio de la biblioteca digital. |
| **RF-TAR-02** | Administrador | El sistema deberá permitir habilitar una tarea de la asignatura en un curso mediante un formulario con los campos: fecha de desbloqueo, fecha de vencimiento y archivo(s) subido(s) o enlace(s) asociado(s). La tarea se asocia a un tema del temario; si el tema ya está disponible en el curso, la tarea heredará por defecto la misma fecha de desbloqueo. |
| **RF-TAR-03** | Administrador | El sistema deberá permitir seleccionar n tareas habilitadas en un curso dentro de un rango de fechas de publicación y vencimiento. |
| **RF-TAR-04** | Sistema / Administrador | El sistema deberá mostrar las tareas seleccionadas y permitir registrar una calificación por cada tarea y por cada estudiante, en escala decimal de 0.0 a 5.0. El sistema calculará la media aritmética simple de las n calificaciones y la registrará como calificación de un ítem de evaluación (corte) para el estudiante, ya sea uno existente o uno nuevo. Las tareas sin calificación contarán como cero. |
| **RF-TAR-05** | Sistema | El sistema deberá ocultar la tarea al estudiante antes de su fecha de desbloqueo. Desde el desbloqueo hasta el vencimiento estará visible como vigente; después del vencimiento seguirá visible, marcada como vencida y con su fecha. |
| **RF-TAR-06** | Administrador | El sistema deberá permitir editar o eliminar una tarea y sus calificaciones, conservando trazabilidad del usuario, la fecha y los valores anteriores. |

> La entrega de tareas se realiza fuera de la plataforma. El sistema solo registra la publicación y la calificación.

### 4.7 Módulo de proyectos

El módulo de Proyectos se considera fuera del alcance de esta versión. No se implementarán funcionalidades asociadas a él.

### 4.8 Módulo de evaluación

| ID | Actor | Requisito |
|---|---|---|
| **RF-EVA-01** | Administrador | El sistema deberá permitir crear un ítem de evaluación asociado a una asignatura, con el nombre del ítem. El ítem se aplicará posteriormente en los cursos de esa asignatura. |
| **RF-EVA-02** | Administrador | El sistema deberá permitir asociar un ítem de evaluación a estudiantes específicos o a todos los estudiantes del curso, mediante un formulario en el que se seleccione el ítem y se indique el porcentaje de valor del ítem. El porcentaje podrá definirse individualmente para cada estudiante. |
| **RF-EVA-03** | Administrador | El sistema deberá permitir asociar cada rango de tareas a un ítem de evaluación existente o crear uno nuevo, y establecer el porcentaje de valor de ese ítem. |
| **RF-EVA-04** | Administrador | El sistema deberá permitir calificar un ítem asociado a cada estudiante mediante un formulario con un campo numérico decimal en escala de 0.0 a 5.0. |
| **RF-EVA-05** | Sistema | El sistema deberá calcular automáticamente la nota final del estudiante en el curso como la suma ponderada de las calificaciones de sus ítems de evaluación según los porcentajes asignados. La nota final se presentará con dos decimales, aplicando redondeo estándar. |
| **RF-EVA-06** | Administrador | El sistema deberá permitir editar o eliminar un ítem de evaluación y sus calificaciones, conservando trazabilidad del usuario, la fecha y los valores anteriores. |
| **RF-EVA-07** | Sistema | Las calificaciones registradas serán visibles para el estudiante de inmediato, sin requerir una publicación adicional y sin generar notificación. |
| **RF-EVA-08** | Administrador | El sistema deberá permitir sobrescribir manualmente la nota final calculada, exigiendo una justificación y conservando trazabilidad del usuario, la fecha y el valor anterior. |

### 4.9 Módulo de asistencia a clases

| ID | Actor | Requisito |
|---|---|---|
| **RF-ASI-01** | Administrador / Monitor | El sistema deberá permitir registrar una clase mediante un formulario con la fecha y hora de realización, la asociación a un tema y, opcionalmente, a uno o varios contenidos, y la selección o incorporación de los estudiantes que asistieron. Los estudiantes no seleccionados se registrarán como ausentes. |
| **RF-ASI-02** | Administrador / Monitor | El sistema deberá permitir editar la asistencia de una clase y eliminar una clase registrada, conservando trazabilidad del usuario, la fecha y los valores anteriores. |

> El sistema no validará solapamientos entre clases del mismo curso.

### 4.10 Requisitos generales de acceso y usuario

| ID | Actor | Requisito |
|---|---|---|
| **RF-ACC-01** | Administrador | El sistema deberá otorgar al Administrador permisos de edición para la gestión general de la plataforma. |
| **RF-ACC-02** | Estudiante | El sistema deberá permitir al Estudiante consultar el temario, los materiales, las tareas y sus fechas, sus calificaciones, su asistencia, sus bonos y sus asignaciones de lectura, únicamente para los cursos en los que esté matriculado y solo respecto de su propia información. |
| **RF-ACC-03** | Administrador | El sistema deberá permitir designar o revocar como Monitor a un estudiante matriculado en un curso. La designación aplicará únicamente a ese curso. |
| **RF-ACC-04** | Sistema | El sistema deberá autenticar a los usuarios mediante el servicio de inicio de sesión único (SSO) institucional de Google Workspace. |
| **RF-ACC-05** | Monitor | El sistema deberá permitir al Monitor consultar las calificaciones de los cursos en los que actúa, sin poder modificarlas. |
| **RF-ACC-06** | Sistema | El sistema deberá permitir el inicio de sesión con cualquier cuenta de Google, siempre que el correo esté previamente registrado como usuario por el Administrador. |

---

## 5. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| **RNF-BON-01** | Restricción de negocio | El sistema solo permitirá que un estudiante acumule un máximo de diez (10) puntos dentro de un curso. |
| **RNF-BON-02** | Restricción de negocio | Un estudiante solo podrá tener un máximo de cuatro (4) bonos asociados al concepto «Examen Lectura» dentro de un mismo curso. |
| **RNF-EVA-01** | Validación | El sistema deberá advertir cuando la suma de porcentajes de los ítems de evaluación de un estudiante en un curso sea distinta de 100%, sin bloquear el guardado. |
| **RNF-DIS-01** | Disponibilidad | El sistema deberá tener una disponibilidad mínima del 99% durante el periodo académico. |
| **RNF-REN-01** | Rendimiento | Las operaciones habituales deberán responder en menos de dos (2) segundos en condiciones normales de uso. |
| **RNF-USA-01** | Usabilidad y accesibilidad | La interfaz deberá ser responsive (móvil, tableta y escritorio) y cumplir WCAG 2.1 nivel AA. |
| **RNF-AUD-01** | Auditoría | Toda creación, edición o eliminación de calificaciones, bonos y asistencia deberá registrar el usuario, la fecha y los valores anteriores. |
| **RNF-SEG-01** | Seguridad | Todo el tráfico deberá cifrarse mediante HTTPS. La autorización se aplicará por rol y por curso, con acceso a los datos estrictamente necesarios. |
| **RNF-COM-01** | Compatibilidad | El sistema deberá funcionar en las dos últimas versiones de Chrome, Edge, Firefox y Safari, tanto en escritorio como en móvil. |
| **RNF-OPE-01** | Operación | Todas las fechas y plazos se calcularán en la zona horaria America/Bogota (UTC-5). |
| **RNF-NOT-01** | Notificación | El sistema deberá notificar al estudiante cuando se habilite una nueva tarea, por correo institucional y dentro de la plataforma. Las calificaciones serán visibles al registrarse, sin generar notificación. |
| **RNF-DAT-01** | Precisión de datos | Las calificaciones y los porcentajes admitirán hasta dos decimales. |
| **RNF-LEC-01** | Regla de negocio / Automatización | El sistema deberá invalidar automáticamente el turno de un candidato al vencer su plazo: el primer candidato hasta las 23:59 del día de publicación, el segundo hasta las 12:00 del día siguiente y el tercero hasta las 18:00 del día siguiente a ese. Si ninguno acepta, se aplicará la apertura de 24 horas definida en RF-LEC-06. |
| **RNF-LEC-02** | Notificación | El sistema deberá notificar a todos los estudiantes matriculados en el curso cuando se genere una lista de candidatos para un capítulo y cuando un capítulo quede vacante y abierto. También notificará al candidato cuando se habilite su turno. La notificación se enviará por correo institucional y se mostrará dentro de la plataforma. Podrá habilitarse adicionalmente Web Push. |


