import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Prisma, no bcrypt. Used by middleware.
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.is_admin = (user as any).is_admin
      }
      return token
    },
    session({ session, token }) {
      session.user.id       = token.id as string
      session.user.is_admin = token.is_admin as boolean
      return session
    },
  },
} satisfies NextAuthConfig
