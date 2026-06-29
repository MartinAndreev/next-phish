import "./container-init";
import {
  Container,
  EMAIL_SERVICE_TOKEN,
  OrganizationRepository,
  RevokeOrgApiKeysCommand,
  registerAuth,
  renderTemplate,
} from "@next-phish/backend";
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
import { apiKey } from "@better-auth/api-key";
import { db } from "@next-phish/database";

const email = Container.get<IEmailService>(EMAIL_SERVICE_TOKEN);

const patRateLimitMax = parseInt(
  process.env.PAT_RATE_LIMIT_MAX_REQUESTS ?? "1000",
  10,
);
const patRateLimitWindow = parseInt(
  process.env.PAT_RATE_LIMIT_TIME_WINDOW ?? "3600000",
  10,
);

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
    session: {
      create: {
        before: async (session) => {
          const orgRepo = Container.get(OrganizationRepository);
          const member = await orgRepo.findFirstByUserId(session.userId);

          return {
            data: {
              ...session,
              activeOrganizationId: member?.organizationId ?? null,
            },
          };
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
      organizationHooks: {
        afterRemoveMember: async ({ user, organization }) => {
          const command = Container.get(RevokeOrgApiKeysCommand);
          await command.execute({
            userId: user.id,
            organizationId: organization.id,
          });
        },
      },
    }),
    apiKey({
      defaultPrefix: "pat_",
      references: "user",
      enableMetadata: true,
      enableSessionForAPIKeys: true,
      apiKeyHeaders: "x-api-key",
      rateLimit: {
        enabled: true,
        maxRequests: patRateLimitMax,
        timeWindow: patRateLimitWindow,
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

registerAuth(auth);
