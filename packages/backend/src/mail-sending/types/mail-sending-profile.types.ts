export interface MailSendingProfileView {
  id: string;
  organizationId: string;
  name: string;
  providerType: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  headers: Record<string, unknown> | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  providerConfig: Record<string, unknown>;
}
