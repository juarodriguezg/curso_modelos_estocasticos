// Migración de datos del módulo 4.3: convierte los grupos actuales en cursos.
//
// - Asocia los temas sin asignatura a la asignatura indicada (el temario actual
//   es de Modelos Estocásticos).
// - Crea el periodo y un curso por cada valor de User.grupo > 0 (grupo = curso).
// - Matricula a cada estudiante en el curso de su grupo.
// - Copia la visibilidad visibleGroup1/2 = false a CourseTopic.
//
// Es idempotente: se puede ejecutar varias veces sin duplicar nada.
// Uso (haz un respaldo con pg_dump antes de ejecutarlo en producción):
//   SUBJECT_CODE=... SUBJECT_NAME="Modelos Estocásticos" \
//   PERIOD_NAME=2026-2S PERIOD_START=2026-08-03 PERIOD_END=2026-11-28 \
//   node prisma/backfill-courses.js --dry-run
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')

class DryRun extends Error {}

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    console.error(`Falta la variable de entorno ${name}`)
    process.exit(1)
  }
  return value
}

function dateOnly(name) {
  const value = required(name)
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) {
    console.error(`${name} debe tener el formato AAAA-MM-DD`)
    process.exit(1)
  }
  return date
}

function slugify(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  const subjectCode = required('SUBJECT_CODE')
  const periodName = required('PERIOD_NAME')
  const startDate = dateOnly('PERIOD_START')
  const endDate = dateOnly('PERIOD_END')
  if (startDate >= endDate) {
    console.error('PERIOD_START debe ser anterior a PERIOD_END')
    process.exit(1)
  }

  const summary = await prisma.$transaction(async (tx) => {
    let subject = await tx.subject.findUnique({ where: { code: subjectCode } })
    if (!subject) {
      const name = required('SUBJECT_NAME')
      subject = await tx.subject.create({
        data: { code: subjectCode, name, slug: slugify(name) || 'asignatura', objective: '' }
      })
      console.log(`Asignatura creada: ${subject.code} — ${subject.name}`)
    }

    let period = await tx.academicPeriod.findUnique({ where: { name: periodName } })
    if (!period) {
      period = await tx.academicPeriod.create({ data: { name: periodName, startDate, endDate } })
      console.log(`Periodo creado: ${period.name}`)
    }

    const topics = await tx.topic.updateMany({
      where: { subjectId: null },
      data: { subjectId: subject.id }
    })

    const groups = await tx.user.findMany({
      where: { role: 'student', grupo: { gt: 0 } },
      distinct: ['grupo'],
      select: { grupo: true }
    })

    const courseByGroup = new Map()
    for (const { grupo } of groups) {
      const group = String(grupo)
      const course = await tx.course.upsert({
        where: { subjectId_periodId_group: { subjectId: subject.id, periodId: period.id, group } },
        create: { subjectId: subject.id, periodId: period.id, group },
        update: {}
      })
      courseByGroup.set(grupo, course)
    }

    const students = await tx.user.findMany({
      where: { role: 'student', grupo: { gt: 0 } },
      select: { id: true, grupo: true }
    })
    let enrollments = 0
    for (const student of students) {
      const course = courseByGroup.get(student.grupo)
      const existing = await tx.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId: course.id, userId: student.id } }
      })
      if (!existing) {
        await tx.courseEnrollment.create({ data: { courseId: course.id, userId: student.id } })
        enrollments++
      }
    }

    let hidden = 0
    for (const [grupo, field] of [[1, 'visibleGroup1'], [2, 'visibleGroup2']]) {
      const course = courseByGroup.get(grupo)
      if (!course) continue
      const hiddenTopics = await tx.topic.findMany({
        where: { subjectId: subject.id, [field]: false },
        select: { id: true }
      })
      for (const { id } of hiddenTopics) {
        await tx.courseTopic.upsert({
          where: { courseId_topicId: { courseId: course.id, topicId: id } },
          create: { courseId: course.id, topicId: id, visible: false },
          update: { visible: false }
        })
        hidden++
      }
    }

    const result = {
      asignatura: `${subject.code} — ${subject.name}`,
      periodo: period.name,
      temasAsociados: topics.count,
      cursos: [...courseByGroup.keys()].map((g) => `Grupo ${g}`),
      matriculasNuevas: enrollments,
      temasOcultos: hidden
    }
    if (dryRun) {
      console.log('Simulación (--dry-run), no se guardó nada:', result)
      throw new DryRun()
    }
    return result
  }, { timeout: 120_000 })

  console.log('Migración aplicada:', summary)
}

main()
  .catch((e) => {
    if (e instanceof DryRun) return
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
