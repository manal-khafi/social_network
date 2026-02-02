import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'testuser_curl@example.com';
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { is_verified: true },
    });
    console.log(`User ${user.username} (ID: ${user.id}) has been manually verified.`);
  } catch (error) {
    console.error('Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
