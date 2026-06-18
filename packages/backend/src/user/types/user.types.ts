export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UserView {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}
