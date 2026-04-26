import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function makeAdmin() {
  await prisma.user.updateMany({
    data: { role: 'ADMIN' }
  });
  console.log("SUCCESS: All users in the database have been promoted to ADMIN.");
}

makeAdmin()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  });
