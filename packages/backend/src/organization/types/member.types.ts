export interface MemberView {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}
