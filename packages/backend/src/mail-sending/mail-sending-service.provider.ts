import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import { CacheService, RedisCacheBackend } from "../cache";
import { MailProviderRegistry } from "./registry";
import { MailProfileCacheService } from "./services/mail-profile-cache.service";
import { MailSendingProfileService } from "./services/mail-sending-profile.service";
import { MailDispatcherService } from "./services/mail-dispatcher.service";
import { MailSendingProfileRepository } from "./repositories";
import {
  SMTPProvider,
  MicrosoftGraphProvider,
  GeneralApiProvider,
} from "./providers";
import {
  CreateMailSendingProfileCommand,
  UpdateMailSendingProfileCommand,
  DeleteMailSendingProfileCommand,
  SendTestEmailCommand,
  VerifyConnectionCommand,
} from "./commands";
import {
  GetMailSendingProfilesQuery,
  GetMailSendingProfileByIdQuery,
} from "./queries";
import { EncryptionService } from "../encryption";

export function registerMailSendingServices(
  db: PrismaClient,
  redis: Redis,
): void {
  const cacheBackend = new RedisCacheBackend(redis);
  const cacheService = new CacheService(cacheBackend);
  Container.set(CacheService, cacheService);

  const encryption = Container.get(EncryptionService);

  const registry = new MailProviderRegistry();
  registry.register(new SMTPProvider());
  registry.register(new MicrosoftGraphProvider());
  registry.register(new GeneralApiProvider());
  Container.set(MailProviderRegistry, registry);

  const profileCache = new MailProfileCacheService(cacheService, encryption);
  Container.set(MailProfileCacheService, profileCache);

  const profileRepo = new MailSendingProfileRepository(db);
  Container.set(MailSendingProfileRepository, profileRepo);

  const profileService = new MailSendingProfileService(
    profileRepo,
    registry,
    profileCache,
  );
  Container.set(MailSendingProfileService, profileService);

  const dispatcher = new MailDispatcherService(
    profileRepo,
    registry,
    profileCache,
  );
  Container.set(MailDispatcherService, dispatcher);

  Container.set(
    CreateMailSendingProfileCommand,
    new CreateMailSendingProfileCommand(profileService),
  );
  Container.set(
    UpdateMailSendingProfileCommand,
    new UpdateMailSendingProfileCommand(profileService),
  );
  Container.set(
    DeleteMailSendingProfileCommand,
    new DeleteMailSendingProfileCommand(profileService),
  );
  Container.set(SendTestEmailCommand, new SendTestEmailCommand(dispatcher));
  Container.set(
    VerifyConnectionCommand,
    new VerifyConnectionCommand(dispatcher),
  );

  Container.set(
    GetMailSendingProfilesQuery,
    new GetMailSendingProfilesQuery(profileRepo, profileService),
  );
  Container.set(
    GetMailSendingProfileByIdQuery,
    new GetMailSendingProfileByIdQuery(profileRepo, profileService, registry),
  );
}

export {
  MailSendingProfileRepository,
  MailSendingProfileService,
  MailDispatcherService,
  MailProfileCacheService,
  MailProviderRegistry,
  SMTPProvider,
  MicrosoftGraphProvider,
  GeneralApiProvider,
  CreateMailSendingProfileCommand,
  UpdateMailSendingProfileCommand,
  DeleteMailSendingProfileCommand,
  SendTestEmailCommand,
  VerifyConnectionCommand,
  GetMailSendingProfilesQuery,
  GetMailSendingProfileByIdQuery,
};
