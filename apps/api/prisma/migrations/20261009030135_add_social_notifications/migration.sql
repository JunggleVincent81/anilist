-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('FOLLOW', 'ACTIVITY_LIKE', 'ACTIVITY_REPLY');

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "sourceId" UUID NOT NULL,
    "targetActivityId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_createdAt_id_idx" ON "Notification"("recipientId", "isRead", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_id_idx" ON "Notification"("recipientId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_targetActivityId_idx" ON "Notification"("targetActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientId_kind_sourceId_key" ON "Notification"("recipientId", "kind", "sourceId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetActivityId_fkey" FOREIGN KEY ("targetActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
