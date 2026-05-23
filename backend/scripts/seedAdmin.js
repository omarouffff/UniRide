require('dotenv').config();
const { prisma, connectDatabase } = require('../prisma/client');

async function seedAdmin() {
  await connectDatabase();

  const email = (process.env.ADMIN_EMAIL || 'admin@uniride.app').toLowerCase();
  const name = process.env.ADMIN_NAME || 'UniRide Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const admin = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        status: 'approved',
        universityIdStatus: 'approved',
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Admin user ready: ${admin.email}`);
  } else {
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        role: 'admin',
        status: 'approved',
        universityIdStatus: 'approved',
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  }

  await prisma.$disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
