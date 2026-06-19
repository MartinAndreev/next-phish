import type { OrganizationWithMembers, OrganizationView } from "../types";

export class OrganizationService {
  toView(org: OrganizationWithMembers, userId: string): OrganizationView {
    const membership = org.members.find((m) => m.userId === userId);

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      createdAt: org.createdAt,
      $me: {
        id: membership?.id ?? "",
        userId,
        role: membership?.role ?? "member",
        createdAt: membership?.createdAt ?? new Date(),
      },
    };
  }

  toViewList(
    rows: OrganizationWithMembers[],
    userId: string,
  ): OrganizationView[] {
    return rows.map((org) => this.toView(org, userId));
  }
}
