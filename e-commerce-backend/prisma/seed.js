import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stockPhoto = (id) =>
  `https://images.unsplash.com/photo-${id}?fit=crop&w=800&q=80&fm=jpg`;

const products = [
  ['Wireless Headphones', 'Wireless over-ear headphones with noise cancellation.', 129.99, stockPhoto('1505740420928-5e560c06d30e')],
  ['Smart Watch', 'A fitness and notification smartwatch for every day.', 199.99, stockPhoto('1523275335684-37898b6baf30')],
  ['Running Shoes', 'Lightweight shoes designed for comfort and speed.', 89.99, stockPhoto('1542291026-7eec264c27ff')],
  ['Leather Backpack', 'A durable everyday backpack with padded compartments.', 74.99, stockPhoto('1553062407-98eeb64c6a62')],
  ['Mechanical Keyboard', 'Compact mechanical keyboard with tactile switches.', 109.99, stockPhoto('1587829741301-dc798b83add3')],
  ['Smartphone', 'Unlocked smartphone with a vivid OLED display.', 699.99, stockPhoto('1511707171634-5f897ff02aa9')],
  ['Digital Camera', 'Mirrorless camera for crisp photos and 4K video.', 899.99, stockPhoto('1516035069371-29a1b244cc32')],
  ['Coffee Maker', 'Programmable coffee maker for fresh coffee every morning.', 59.99, stockPhoto('1495474472287-4d71bcdd2085')],
  ['Desk Lamp', 'Adjustable LED desk lamp with multiple brightness levels.', 39.99, stockPhoto('1507473885765-e6ed057f782c')],
  ['Bluetooth Speaker', 'Portable waterproof speaker with rich sound.', 79.99, stockPhoto('1608043152269-423dbba4e7e1')],
  ['Gaming Mouse', 'Ergonomic gaming mouse with programmable controls.', 49.99, stockPhoto('1527814050087-3793815479db')],
  ['Tablet', 'High-resolution tablet for work and entertainment.', 449.99, stockPhoto('1544244015-0df4b3ffc6b0')],
  ['Electric Kettle', 'Fast-boiling kettle with automatic shutoff.', 34.99, stockPhoto('1594212699903-ec8a3eca50f5')],
  ['Yoga Mat', 'Non-slip exercise mat with cushioned support.', 29.99, stockPhoto('1544367567-0f2fcb009e0b')],
  ['Sunglasses', 'Polarized sunglasses with lightweight frames.', 54.99, stockPhoto('1511499767150-a48a237f0083')],
  ['Portable Monitor', 'Slim 15-inch monitor for work or travel.', 249.99, stockPhoto('1593642632823-8f785ba67e45')],
  ['Fitness Tracker', 'Water-resistant activity and sleep tracker.', 69.99, stockPhoto('1538805060514-97d9cc17730c')],
  ['Office Chair', 'Ergonomic chair with lumbar support and adjustable height.', 319.99, stockPhoto('1586023492125-27b2c045efd7')],
  ['Instant Camera', 'Compact instant camera for physical photo prints.', 119.99, stockPhoto('1512790182412-b19e6d62bc39')],
  ['Travel Suitcase', 'Durable carry-on suitcase with smooth spinner wheels.', 159.99, stockPhoto('1565026057447-bc90a3dceb87')],
];

async function main() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: products.map(([name, description, price, imageUrl]) => ({
      name,
      description,
      price,
      imageUrl,
    })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
