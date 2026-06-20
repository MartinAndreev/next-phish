export { initializeContainer, registerAuth, Container } from "./container";

export {
  EmailProviderType,
  EMAIL_SERVICE_TOKEN,
  emailProviderToken,
  EmailService,
  NodemailerProvider,
} from "./email";
export type { IEmailService, IEmailProvider, SendEmailOptions } from "./email";
export { renderTemplate } from "./email/templates";

export { MessageBus } from "./message-bus";
export type { ICommandHandler, IQueryHandler } from "./message-bus";

export {
  UserRepository,
  CreateUserCommand,
  GetUserCountQuery,
  GetUserByEmailQuery,
} from "./user";
export type { CreateUserData, UserView } from "./user";
export {
  CreateUserSchema,
  GetUserByEmailSchema,
  GetUserCountSchema,
} from "./user";
export type {
  CreateUserInput,
  GetUserByEmailInput,
  GetUserCountInput,
} from "./user";

export {
  OrganizationRepository,
  OrganizationService,
  GetUserOrganizationsQuery,
  GetOrganizationByIdQuery,
  GetOrganizationMembersQuery,
  CreateOrganizationCommand,
  DeleteOrganizationCommand,
} from "./organization";
export type {
  OrganizationView,
  CreateOrganizationData,
  OrganizationWithMembers,
  MemberView,
} from "./organization";
export {
  GetUserOrganizationsSchema,
  CreateOrganizationCommandSchema,
  GetOrganizationMembersSchema,
} from "./organization";
export type {
  GetUserOrganizationsInput,
  CreateOrganizationCommandInput,
  GetOrganizationMembersInput,
} from "./organization";
export { registerOrganizationServices } from "./organization";
