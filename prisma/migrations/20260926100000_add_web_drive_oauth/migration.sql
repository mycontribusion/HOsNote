-- CreateTable
CREATE TABLE "WebDriveSession" (
    "id" TEXT NOT NULL,
    "clientKeyHash" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "googleEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebDriveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthTransaction" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "clientKeyHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebDriveSession_clientKeyHash_key" ON "WebDriveSession"("clientKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthTransaction_state_key" ON "OAuthTransaction"("state");
