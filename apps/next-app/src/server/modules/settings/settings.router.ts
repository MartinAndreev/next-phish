import { z } from "zod";
import { ignoredNetworkSchema } from "@next-phish/shared";
import {
  Container,
  DeliveryRepository,
  normalizeNetwork,
} from "@next-phish/backend";
import { adminProcedure, router } from "../../trpc/procedures";

export const settingsRouter = router({
  listIgnoredNetworks: adminProcedure.query(() =>
    Container.get(DeliveryRepository).listIgnoredNetworks(null),
  ),

  createIgnoredNetwork: adminProcedure
    .input(ignoredNetworkSchema)
    .mutation(({ ctx, input }) =>
      Container.get(DeliveryRepository).createIgnoredNetwork({
        organizationId: null,
        createdById: ctx.userId,
        network: input.network,
        normalizedNetwork: normalizeNetwork(input.network).canonical,
        description: input.description,
      }),
    ),

  deleteIgnoredNetwork: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      Container.get(DeliveryRepository).deleteIgnoredNetwork(
        input.id,
        null,
        ctx.userId,
      ),
    ),
});
