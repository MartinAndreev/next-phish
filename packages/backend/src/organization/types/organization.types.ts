export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  $me: {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
  };
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export interface OrganizationWithMembers {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  members: {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
  }[];
}
