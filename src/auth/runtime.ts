import { createContext, useContext } from "react";
export type AuthRuntime = {
  configured: boolean;
  loaded: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
};
export const AuthContext = createContext<AuthRuntime>({ configured: false, loaded: true, userId: null, getToken: async () => null });
export const useAccount = () => useContext(AuthContext);
