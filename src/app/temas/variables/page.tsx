import ClassLayout from "@/components/ClassLayout"
import { BlockMath, InlineMath } from "react-katex"

export default function Variables() {
  return (
    <ClassLayout
      title="Variables Aleatorias"
      videoUrl="https://www.youtube.com/embed/U33OftLWdu4"
      materialUrl="/documents/ME01 Enunciado y entrega del Taller No  01 Simulación de MANET.pdf"
      tareas={[
        {
          nombre: "Tarea 4: Experimentos aleatorios y espacios de probabilidad",
          enlace: "/documents/MEXX ListaOficialDeTareas lunes 29 de septiembre de 2025.pdf#page=6",
        },
        {
          nombre: "Tarea 5: Función de probabilidad alternativa",
          enlace: "/documents/MEXX ListaOficialDeTareas lunes 29 de septiembre de 2025.pdf#page=7",
        },
      ]}
      resumen={
        <>
          <p>
                Una <strong>variable aleatoria</strong> es una función matemática que asigna
                valores numéricos a los resultados de un experimento aleatorio. Formalmente,
                si el espacio muestral se denota como <InlineMath math="\Omega" />, una variable
                aleatoria es una función
                <InlineMath math="X: \Omega \to \mathbb{R}" />.
              </p>

              <p>
                Existen dos tipos principales de variables aleatorias:
                <em> discretas</em>, que toman valores finitos o contables, y
                <em> continuas</em>, que pueden tomar un número infinito de valores dentro de
                un intervalo. 
              </p>

              <p>
                Para una variable aleatoria discreta, la probabilidad de que tome un valor{" "}
                <InlineMath math="x_i" /> está dada por una <strong>función de probabilidad</strong>:
              </p>
              <BlockMath math="P(X = x_i) = p(x_i), \quad \sum_i p(x_i) = 1" />

              <p>
                En el caso de variables continuas, se define una{" "}
                <strong>función de densidad de probabilidad</strong> (fdp), tal que:
              </p>
              <BlockMath math="P(a \leq X \leq b) = \int_a^b f(x)\,dx, \quad \int_{-\infty}^{\infty} f(x)\,dx = 1" />

              <p>
                La <strong>esperanza matemática</strong> es un valor central de la variable:
              </p>
              <BlockMath math="E[X] = \sum_i x_i p(x_i) \quad \text{(discreta)} \quad \text{o} \quad E[X] = \int_{-\infty}^{\infty} x f(x)\,dx \quad \text{(continua)}" />

              <p>
                El <strong>valor esperado</strong> y la <strong>varianza</strong> permiten describir
                la tendencia central y la dispersión de la variable, siendo la varianza:
              </p>
              <BlockMath math="\text{Var}(X) = E[(X - E[X])^2]" />

              <p>
                Estas nociones son fundamentales para modelar fenómenos aleatorios en ingeniería,
                economía, ciencias sociales y computación, proporcionando herramientas matemáticas
                para analizar la incertidumbre y tomar decisiones informadas.
              </p>
        </>
      }
    />
  )
}
