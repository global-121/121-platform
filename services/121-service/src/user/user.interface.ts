export interface UserData {
  username: string;
  email: string;
  token: string;
  role: string;
  status: string;
  countryId: number;
}

export interface UserRO {
  user: UserData;
}
