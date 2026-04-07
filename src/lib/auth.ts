import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User { role: UserRole; }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
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
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name || email.split("@")[0],
              image: user.image || null,
              role: userCount === 0 ? "SUPER_ADMIN" : "CUSTOMER",
            },
          });
        } else {
          // Update image on each login
          if (user.image && user.image !== dbUser.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }
        }
        if (!dbUser.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = token as any;
          t.role = dbUser.role;
          t.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session as any;
      s.user.role = token.role;
      s.user.id = token.id;
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
