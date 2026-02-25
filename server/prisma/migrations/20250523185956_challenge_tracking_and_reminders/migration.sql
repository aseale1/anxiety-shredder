-- CreateTable
CREATE TABLE "challenge_reminders" (
    "reminder_id" SERIAL NOT NULL,
    "chall_id" INTEGER NOT NULL,
    "firebase_uid" VARCHAR(255) NOT NULL,
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" VARCHAR(255),
    "last_sent" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_reminders_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_reminders_chall_id_firebase_uid_key" ON "challenge_reminders"("chall_id", "firebase_uid");

-- AddForeignKey
ALTER TABLE "challenge_reminders" ADD CONSTRAINT "challenge_reminders_chall_id_fkey" FOREIGN KEY ("chall_id") REFERENCES "challenges"("chall_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenge_reminders" ADD CONSTRAINT "challenge_reminders_firebase_uid_fkey" FOREIGN KEY ("firebase_uid") REFERENCES "users"("firebase_uid") ON DELETE CASCADE ON UPDATE NO ACTION;
