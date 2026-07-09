import { MailSendingProfileService } from "../services";
import type { MailSendingProfileView } from "../types";
import { MailSendingProfileRepository } from "../repositories";
import type { IQueryHandler } from "../../message-bus";
import type {
  GetMailSendingProfilesInput,
  GetMailSendingProfileByIdInput,
} from "../validations";
import { MailProviderRegistry } from "../registry";

interface GetMailSendingProfilesData extends GetMailSendingProfilesInput {
  organizationId: string;
}

interface GetMailSendingProfilesResult {
  profiles: MailSendingProfileView[];
  total: number;
}

export class GetMailSendingProfilesQuery implements IQueryHandler<
  GetMailSendingProfilesData,
  GetMailSendingProfilesResult
> {
  constructor(
    private readonly repo: MailSendingProfileRepository,
    private readonly service: MailSendingProfileService,
  ) {}

  async execute(
    data: GetMailSendingProfilesData,
  ): Promise<GetMailSendingProfilesResult> {
    const { rows, total } = await this.repo.findByOrganizationId(
      data.organizationId,
      {
        search: data.search,
        limit: data.limit,
        offset: data.offset,
        sort: data.sort,
      },
    );

    return {
      profiles: rows.map((row) => this.service.toListItemView(row)),
      total,
    };
  }
}

interface GetMailSendingProfileByIdData extends GetMailSendingProfileByIdInput {
  organizationId: string;
}

export class GetMailSendingProfileByIdQuery implements IQueryHandler<
  GetMailSendingProfileByIdData,
  MailSendingProfileView | null
> {
  constructor(
    private readonly repo: MailSendingProfileRepository,
    private readonly service: MailSendingProfileService,
    private readonly registry: MailProviderRegistry,
  ) {}

  async execute(
    data: GetMailSendingProfileByIdData,
  ): Promise<MailSendingProfileView | null> {
    const row = await this.repo.findById(data.id, data.organizationId);
    if (!row) return null;

    const provider = this.registry.get(row.providerType);
    return this.service.toView(row, provider);
  }
}
