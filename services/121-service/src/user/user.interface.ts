export interface UserData {
  email: string;
  token: string;
  role: string;
  status: string;
}

export interface UserRO {
  user: UserData;
}
