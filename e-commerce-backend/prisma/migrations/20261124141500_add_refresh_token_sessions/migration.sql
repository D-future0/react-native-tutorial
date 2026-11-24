CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RefreshToken" ADD COLUMN "sessionId" TEXT;

INSERT INTO "Session" ("id", "userId", "createdAt", "expiresAt", "revokedAt")
SELECT
    'legacy-' || "id",
    "userId",
    "createdAt",
    "expiresAt",
    "revokedAt"
FROM "RefreshToken";

UPDATE "RefreshToken"
SET "sessionId" = 'legacy-' || "id";

ALTER TABLE "RefreshToken" ALTER COLUMN "sessionId" SET NOT NULL;

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");

ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
