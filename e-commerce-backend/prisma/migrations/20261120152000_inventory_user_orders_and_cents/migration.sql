ALTER TABLE "Product"
ADD COLUMN "priceCents" INTEGER;

UPDATE "Product"
SET "priceCents" = ROUND("price"::NUMERIC * 100)::INTEGER;

ALTER TABLE "Product"
ALTER COLUMN "priceCents" SET NOT NULL;

ALTER TABLE "Product"
DROP COLUMN "price";

ALTER TABLE "Product"
ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 20;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_priceCents_nonnegative" CHECK ("priceCents" >= 0),
ADD CONSTRAINT "Product_stockQuantity_nonnegative" CHECK ("stockQuantity" >= 0);

ALTER TABLE "Order"
ADD COLUMN "totalCents" INTEGER;

UPDATE "Order"
SET "totalCents" = ROUND("total"::NUMERIC * 100)::INTEGER;

ALTER TABLE "Order"
ALTER COLUMN "totalCents" SET NOT NULL;

ALTER TABLE "Order"
DROP COLUMN "total";

ALTER TABLE "Order"
ADD COLUMN "userId" TEXT;

CREATE INDEX "Order_userId_idx" ON "Order"("userId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
