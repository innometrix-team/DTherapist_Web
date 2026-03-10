import Api from "./Api";
import type { AxiosRequestConfig } from "axios";

export interface IDeleteAccountResponse {
  message: string;
  code: string;
  status: boolean;
}

async function DeleteAccountApi(
  config?: AxiosRequestConfig
): Promise<IDeleteAccountResponse | null> {
  try {
    const response = await Api.delete<IDeleteAccountResponse>(
      "/api/delete",
      config
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting account:", error);
    return null;
  }
}

export default DeleteAccountApi;
