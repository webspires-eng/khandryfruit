"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), twoFactorClient()],
});
export const { signIn, signOut, signUp, useSession } = authClient;
