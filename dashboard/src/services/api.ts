import { getRecoil, setRecoil } from "recoil-nexus";
import { HOST, SCHEME } from "../config";
import { organisationState } from "../recoil/auth";
import { deploymentCommitState, deploymentDateState } from "../recoil/version";
import { resetOrgEncryptionKey, setEnableEncrypt } from "./encryption";
import { AppSentry, capture } from "./sentry";
import { atom } from "recoil";

export const recoilResetKeyState = atom({ key: "recoilResetKeyState", default: 0 });

class Api {
  protected token: string | null = null;

  protected getUrl(path: string, query?: Record<string, string | Date | boolean>) {
    const url = new URL(`${SCHEME}://${HOST}${(path || "").startsWith("/") ? path : `/${path}`}`);
    for (const key in query) {
      if (query[key] === undefined) continue;
      url.searchParams.append(key, String(query[key]));
    }
    return url;
  }

  protected organisationEncryptionStatus() {
    const organisation = getRecoil(organisationState) || {
      encryptionLastUpdateAt: undefined,
      encryptionEnabled: undefined,
      migrationLastUpdateAt: undefined,
    };
    return {
      encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
      encryptionEnabled: organisation.encryptionEnabled,
      migrationLastUpdateAt: organisation.migrationLastUpdateAt,
    };
  }

  protected updateDeploymentStatus(response: Response) {
    if (!response?.headers) return;
    if (response.headers.has("x-api-deployment-commit")) {
      setRecoil(deploymentCommitState, response.headers.get("x-api-deployment-commit"));
      if (!window.localStorage.getItem("deploymentCommit")) {
        window.localStorage.setItem("deploymentCommit", response.headers.get("x-api-deployment-commit"));
      }
    }
    if (response.headers.has("x-api-deployment-date")) {
      setRecoil(deploymentDateState, response.headers.get("x-api-deployment-date"));
      if (!window.localStorage.getItem("deploymentDate")) {
        window.localStorage.setItem("deploymentDate", response.headers.get("x-api-deployment-date"));
      }
    }
  }

  protected needAuthRedirection(response: Response) {
    return response.status === 401 && window?.location?.pathname !== "/auth";
  }

  protected fetchParams(): RequestInit {
    return {
      mode: "cors",
      credentials: "include",
      headers: {
        ...(this.token ? { Authorization: `JWT ${this.token}` } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
        platform: "dashboard",
        version: "2.0.0",
      },
    };
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  reset({ redirect = false }: { redirect?: boolean } = {}) {
    this.setToken(null);
    resetOrgEncryptionKey();
    setEnableEncrypt(false);
    setRecoil(recoilResetKeyState, Date.now());
    AppSentry.setUser({});
    AppSentry.setTag("organisationId", "");
    if (redirect) {
      window.location.href = "/auth";
    }
  }

  async post({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.json();
  }

  async put({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "PUT",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.json();
  }

  async delete({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "DELETE",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.json();
  }

  async get({ path, query = {} }: { path: string; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), { ...this.fetchParams(), method: "GET" });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.json();
  }

  async upload({ path, encryptedFile }: { path: string; encryptedFile: File }) {
    const formData = new FormData();
    formData.append("file", encryptedFile);
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus() }), {
      mode: "cors",
      credentials: "include",
      headers: {
        ...(this.token ? { Authorization: `JWT ${this.token}` } : {}),
        Accept: "application/json",
        platform: "dashboard",
        version: "2.0.0",
      },

      method: "POST",
      body: formData,
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.json();
  }

  async download({ path, query = {} }: { path: string; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), { ...this.fetchParams(), method: "GET" });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) {
      this.reset({ redirect: true });
      return;
    }
    return response.blob();
  }

  async getSigninToken() {
    const response = await fetch(this.getUrl("/user/signin-token"), { ...this.fetchParams(), method: "GET" });
    this.updateDeploymentStatus(response);
    if (response.status === 200 && response.ok) return response.json();
    return {};
  }
}

type ApiResponse = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

type FetchCallback<T extends ApiResponse | Blob> = () => Promise<T>;

export async function tryFetchBlob<T extends Blob>(callback: FetchCallback<T>): Promise<[Error | undefined, T | undefined]> {
  try {
    const result = await callback();
    return [undefined, result];
  } catch (error) {
    capture(error);
    return [error, undefined];
  }
}

export async function tryFetch<T extends ApiResponse>(callback: FetchCallback<T>): Promise<[Error | undefined, T | undefined]> {
  try {
    const result = await callback();
    if (result && !result.ok) return [new Error(result.error), result];
    return [undefined, result];
  } catch (error) {
    capture(error);
    return [error, undefined];
  }
}

// Si le résultat n'est pas ok, on fait une erreur, comme si le fetch avait fail.
// Il s'agit d'un raccourci, dans le cas où on s'en fiche de l'origine de l'erreur
// et qu'on veut la capturer dans tous les cas.
export async function tryFetchExpectOk<T extends ApiResponse>(callback: FetchCallback<T>): Promise<[Error | undefined, T | undefined]> {
  try {
    const result = await callback();
    if (result && result?.ok === false) throw new Error(result.error);
    return [undefined, result];
  } catch (error) {
    capture(error);
    return [error, undefined];
  }
}

const API = new Api();
export default API;
