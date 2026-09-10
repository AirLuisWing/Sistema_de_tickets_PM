const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando la siembra de datos (Seed)...')

  // 1. Verificamos si ya existe algún Administrador para no duplicarlo
  const adminExistente = await prisma.usuario.findFirst({
    where: { rol: 'Administrador' }
  })

  if (!adminExistente) {
    // 2. Encriptamos la contraseña por defecto
    const hashedPassword = await bcrypt.hash('Policia2026!', 10)
    
    // 3. Creamos al Administrador maestro
    await prisma.usuario.create({
      data: {
        nombre: 'Admin_TICs',
        email: 'admin@2026',
        password: hashedPassword,
        rol: 'Administrador',
        area: 'TICS',
        activo: true
      }
    })
    console.log('✅ Cuenta maestra de Administrador creada con éxito.')
    console.log('📧 Correo: admin@2026')
    console.log('🔑 Contraseña: Policia2026!')
  } else {
    console.log('⚡ Ya existe una cuenta de Administrador en la base de datos. Se omite la creación.')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error durante el Seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })