import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear un usuario admin de prueba
  const passwordHash = await bcrypt.hash("admin123", 10)

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador",
      password: passwordHash,
      role: "admin",
      grupo: 0
    },
  })

  console.log("Administrador creado: admin@example.com / admin123")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
