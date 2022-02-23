export interface UserData {
  username: string;
  token: string;
  permissions: string[];
}
export interface UserRO {
  user: UserData;
}
