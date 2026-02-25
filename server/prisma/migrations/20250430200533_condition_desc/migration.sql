-- CreateTable
CREATE TABLE "anxiety_source" (
    "anx_id" SERIAL NOT NULL,
    "anx_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "anxiety_source_pkey" PRIMARY KEY ("anx_id")
);

-- CreateTable
CREATE TABLE "chall_conditions" (
    "chall_id" INTEGER NOT NULL,
    "con_id" INTEGER NOT NULL,

    CONSTRAINT "chall_conditions_pkey" PRIMARY KEY ("chall_id","con_id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "chall_id" SERIAL NOT NULL,
    "firebase_uid" VARCHAR(255),
    "anx_id" INTEGER,
    "chall_level" VARCHAR(255),
    "completed" BOOLEAN DEFAULT false,
    "description" VARCHAR,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("chall_id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "con_id" SERIAL NOT NULL,
    "factor_id" INTEGER,
    "condition_name" VARCHAR(255) NOT NULL,
    "con_desc" VARCHAR(255) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("con_id")
);

-- CreateTable
CREATE TABLE "factor" (
    "factor_id" SERIAL NOT NULL,
    "anx_id" INTEGER,
    "factor_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "factor_pkey" PRIMARY KEY ("factor_id")
);

-- CreateTable
CREATE TABLE "user_anx" (
    "firebase_uid" VARCHAR(255) NOT NULL,
    "anx_id" INTEGER NOT NULL,

    CONSTRAINT "user_anx_pkey" PRIMARY KEY ("firebase_uid","anx_id")
);

-- CreateTable
CREATE TABLE "user_con_rating" (
    "firebase_uid" VARCHAR(255) NOT NULL,
    "con_id" INTEGER NOT NULL,
    "rating" INTEGER,

    CONSTRAINT "user_con_rating_pkey" PRIMARY KEY ("firebase_uid","con_id")
);

-- CreateTable
CREATE TABLE "user_factor" (
    "firebase_uid" VARCHAR(255) NOT NULL,
    "factor_id" INTEGER NOT NULL,

    CONSTRAINT "user_factor_pkey" PRIMARY KEY ("firebase_uid","factor_id")
);

-- CreateTable
CREATE TABLE "users" (
    "firebase_uid" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("firebase_uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "anxiety_source_anx_name_key" ON "anxiety_source"("anx_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "chall_conditions" ADD CONSTRAINT "chall_conditions_chall_id_fkey" FOREIGN KEY ("chall_id") REFERENCES "challenges"("chall_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chall_conditions" ADD CONSTRAINT "chall_conditions_con_id_fkey" FOREIGN KEY ("con_id") REFERENCES "conditions"("con_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_anx_id_fkey" FOREIGN KEY ("anx_id") REFERENCES "anxiety_source"("anx_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_firebase_uid_fkey" FOREIGN KEY ("firebase_uid") REFERENCES "users"("firebase_uid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "factor"("factor_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factor" ADD CONSTRAINT "factor_anx_id_fkey" FOREIGN KEY ("anx_id") REFERENCES "anxiety_source"("anx_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_anx" ADD CONSTRAINT "user_anx_anx_id_fkey" FOREIGN KEY ("anx_id") REFERENCES "anxiety_source"("anx_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_anx" ADD CONSTRAINT "user_anx_firebase_uid_fkey" FOREIGN KEY ("firebase_uid") REFERENCES "users"("firebase_uid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_con_rating" ADD CONSTRAINT "user_con_rating_con_id_fkey" FOREIGN KEY ("con_id") REFERENCES "conditions"("con_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_con_rating" ADD CONSTRAINT "user_con_rating_firebase_uid_fkey" FOREIGN KEY ("firebase_uid") REFERENCES "users"("firebase_uid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_factor" ADD CONSTRAINT "user_factor_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "factor"("factor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_factor" ADD CONSTRAINT "user_factor_firebase_uid_fkey" FOREIGN KEY ("firebase_uid") REFERENCES "users"("firebase_uid") ON DELETE NO ACTION ON UPDATE NO ACTION;
