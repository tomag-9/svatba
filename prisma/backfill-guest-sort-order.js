const { PrismaClient } = require('@prisma/client');
const { parseGuests } = require('./seed');

const prisma = new PrismaClient();

function guestKey(guest) {
  return `${guest.familyGroup ?? 'spolocni'}::${guest.name.toLowerCase()}`;
}

function nextFreeOrder(usedOrders, startAt) {
  let order = startAt;
  while (usedOrders.has(order)) {
    order += 1;
  }
  return order;
}

async function main() {
  const sourceGuests = parseGuests();
  const sourceOrderByKey = new Map(sourceGuests.map((guest) => [guestKey(guest), guest.sortOrder]));
  const usedOrders = new Set(sourceGuests.map((guest) => guest.sortOrder));
  const existingGuests = await prisma.guest.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });

  let nextOrder = sourceGuests.length + 1;
  let updates = 0;

  for (const guest of existingGuests) {
    let sortOrder = sourceOrderByKey.get(guestKey(guest));

    if (!sortOrder) {
      if (guest.sortOrder > sourceGuests.length && !usedOrders.has(guest.sortOrder)) {
        sortOrder = guest.sortOrder;
      } else {
        sortOrder = nextFreeOrder(usedOrders, nextOrder);
      }
    }

    usedOrders.add(sortOrder);
    nextOrder = nextFreeOrder(usedOrders, sortOrder + 1);

    if (guest.sortOrder !== sortOrder) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: { sortOrder }
      });
      updates += 1;
    }
  }

  console.log(`Guest sort order backfill complete (${updates} updated).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
