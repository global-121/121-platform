export interface UserData {
  username: string;
  token?: string;
  permissions: object;
}
export interface UserRO {
  user: UserData;
}
