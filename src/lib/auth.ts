import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        let profile
        try {
          profile = await prisma.profile.findUnique({ where: { email } })
        } catch {
          return null
        }
        if (!profile) return null

        let valid
        try {
          valid = await bcrypt.compare(password, profile.password_hash)
        } catch {
          return null
        }
        if (!valid) return null

        return {
          id:       profile.id,
          email:    profile.email,
          name:     profile.full_name ?? undefined,
          is_admin: profile.is_admin,
        }
      },
    }),
  ],
})

declare module 'next-auth' {
  interface Session {
    user: {
      id:       string
      email:    string
      name?:    string
      is_admin: boolean
    }
  }
}
