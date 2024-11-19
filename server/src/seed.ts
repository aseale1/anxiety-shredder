import prisma from './prisma';

async function main() {
  await prisma.users.create({
    data: {
      firebase_uid: "12345xyz",
      email: "testuser@example.com",
      first_name: "Test"
    },
  });
  console.log("Test user created");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
