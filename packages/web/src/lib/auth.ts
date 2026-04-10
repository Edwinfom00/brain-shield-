import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  // ── Email + password (optionnel, désactivable) ────────────────────────────
  emailAndPassword: {
    enabled: true,
  },

  // ── Social providers ──────────────────────────────────────────────────────
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // ── Session ───────────────────────────────────────────────────────────────
  session: {
    expiresIn:          60 * 60 * 24 * 7,  // 7 jours
    updateAge:          60 * 60 * 24,       // refresh si > 1 jour
    cookieCache: {
      enabled:   true,
      maxAge:    5 * 60,                    // cache 5 min côté client
    },
  },

  // ── Redirects après auth ──────────────────────────────────────────────────
  user: {
    additionalFields: {},
  },
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;
