ALTER TABLE "Order"
ADD COLUMN "total" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Order" AS orders
SET "total" = COALESCE(
  (
    SELECT SUM(
      CASE
        WHEN item->>'price' ~ '^[0-9]+([.][0-9]+)?$'
          AND item->>'quantity' ~ '^[0-9]+$'
        THEN (item->>'price')::DOUBLE PRECISION * (item->>'quantity')::DOUBLE PRECISION
        ELSE 0
      END
    )
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(orders."items"::JSONB) = 'array'
        THEN orders."items"::JSONB
        ELSE '[]'::JSONB
      END
    ) AS elements(item)
  ),
  0
);

ALTER TABLE "Order"
ALTER COLUMN "total" DROP DEFAULT;
