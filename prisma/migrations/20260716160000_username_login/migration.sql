-- Optional usernames for Better Auth. Existing email-only accounts remain valid.
ALTER TABLE "user" ADD COLUMN "username" TEXT;
ALTER TABLE "user" ADD COLUMN "displayUsername" TEXT;
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
