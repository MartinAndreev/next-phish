import { Container } from "./container";
import { EMAIL_SERVICE_TOKEN, renderTemplate } from "@next-phish/backend";
import type { IEmailService } from "@next-phish/backend";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  magicLink,
  twoFactor,
  organization,
  emailOTP,
} from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@next-phish/database";

const email = Container.get<IEmailService>(EMAIL_SERVICE_TOKEN);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  appName: "Next Phish",
  experimental: { joins: true },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "user"],
        required: false,
        defaultValue: "user",
        input: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            await db.setting.create({
              data: { key: "initialized", value: { initialized: true } },
            });
            return { data: { ...user, role: "admin" } };
          } catch {
            return { data: user };
          }
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email: to, url }) => {
        await email.send({
          to,
          subject: "Sign in to Next Phish",
          html: renderTemplate("magic-link", { url }),
        });
      },
    }),
    twoFactor({
      skipVerificationOnEnable: true,
      issuer: "Next Phish",
    }),
    emailOTP({
      async sendVerificationOTP({ email: to, otp, type }) {
        if (type === "forget-password") {
          await email.send({
            to,
            subject: "Your password reset code",
            html: renderTemplate("otp", { otp }),
          });
        }
      },
    }),
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.APP_URL}/accept-invitation/${data.id}`;
        await email.send({
          to: data.email,
          subject: `${data.inviter.user.name} invited you to ${data.organization.name}`,
          html: renderTemplate("organization-invitation", {
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            inviteLink,
          }),
        });
      },
    }),
    nextCookies(),
  ],
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    callbackURL: "/login?message=email-verified",
    sendVerificationEmail: async ({ user: { email: to }, url }) => {
      await email.send({
        to,
        subject: "Verify your email address",
        html: renderTemplate("verify-email", { url }),
      });
    },
  },
});
