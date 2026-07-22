import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import { DeliveryRepository } from "./repositories/delivery.repository";
import { OutboxRepository } from "./repositories/outbox.repository";
import { ScheduleExecutionRepository } from "./repositories/schedule-execution.repository";
import { TrackingService } from "./services/tracking.service";
import { DeliveryProcessorService } from "./services/delivery-processor.service";
import { MailDispatcherService } from "../mail-sending";
import { ProviderWebhookService } from "./services/provider-webhook.service";
import { DistributedRateLimiterService } from "./services/distributed-rate-limiter.service";

export function registerDeliveryServices(db: PrismaClient): void {
  const delivery = new DeliveryRepository(db);
  Container.set(DeliveryRepository, delivery);
  Container.set(OutboxRepository, new OutboxRepository(db));
  Container.set(
    ScheduleExecutionRepository,
    new ScheduleExecutionRepository(db),
  );
  Container.set(TrackingService, new TrackingService(db, delivery));
  Container.set(ProviderWebhookService, new ProviderWebhookService(delivery));
}

export function registerDeliveryWorkerServices(redis: Redis): void {
  const rateLimiter = new DistributedRateLimiterService(redis);
  Container.set(DistributedRateLimiterService, rateLimiter);
  Container.set(
    DeliveryProcessorService,
    new DeliveryProcessorService(
      Container.get(DeliveryRepository),
      Container.get(MailDispatcherService),
      rateLimiter,
    ),
  );
}
