import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User { role: UserRole; isActive: boolean; }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
      isActive: boolean;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          const userCount = await prisma.user.count();
          const isFirstUser = userCount === 0;
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name || email.split("@")[0],
              image: user.image || null,
              role: isFirstUser ? "SUPER_ADMIN" : "CUSTOMER",
              isActive: isFirstUser,
            },
          });
        } else {
          if (user.image && user.image !== dbUser.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }
        }

        // Record login log
        try {
          await prisma.loginLog.create({
            data: {
              userId: dbUser.id,
              provider: account.provider,
            },
          });
        } catch {
          // Don't block login if logging fails
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = token as any;
          t.role = dbUser.role;
          t.id = dbUser.id;
          t.isActive = dbUser.isActive;
        }
      }
      // Re-check isActive from DB on every request to catch admin approvals
      if (trigger !== "signIn" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, role: true },
          });
          if (dbUser) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const t = token as any;
            t.isActive = dbUser.isActive;
            t.role = dbUser.role;
          }
        } catch {
          // Keep existing token values if DB check fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session as any;
      s.user.role = token.role;
      s.user.id = token.id;
      s.user.isActive = token.isActive;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
