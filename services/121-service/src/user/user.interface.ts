export interface UserData {
  username: string;
  token?: string;
  permissions: object;
}

export interface UserRO {
  user: UserData;
}

export interface UserToken {
  id: number;
  username: string;
  exp: number;
}
