import { getRecoil, setRecoil } from "recoil-nexus";
import { HOST, SCHEME } from "../config";
import { organisationState } from "../recoil/auth";
import { deploymentCommitState, deploymentDateState } from "../recoil/version";
import { capture } from "./sentry";
import { toast } from "react-toastify";
import { saveLogToSessionStorage } from "../utils/copy-logs-in-sessionstorage";

class AuthError extends Error {
  constructor() {
    super("Connexion expirée");
    this.name = "AuthError";
  }
}

class Api {
  protected token: string | null = null;
  public abortController: AbortController;

  constructor() {
    this.abortController = new AbortController();
  }

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
    return response.status === 401;
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
        version: "2.1.0",
      },
    };
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  async post({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.json();
  }

  async put({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "PUT",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.json();
  }

  async delete({ path, body = {}, query = {} }: { path: string; body?: unknown; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "DELETE",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.json();
  }

  async get({ path, query = {} }: { path: string; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), { ...this.fetchParams(), method: "GET" });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.json();
  }

  async getAbortable({ path, query = {} }: { path: string; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), {
      ...this.fetchParams(),
      method: "GET",
      signal: this.abortController.signal,
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
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
        version: "2.1.0",
      },

      method: "POST",
      body: formData,
    });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.json();
  }

  async download({ path, query = {} }: { path: string; query?: Record<string, string | Date | boolean> }) {
    const response = await fetch(this.getUrl(path, { ...this.organisationEncryptionStatus(), ...query }), { ...this.fetchParams(), method: "GET" });
    this.updateDeploymentStatus(response);
    if (this.needAuthRedirection(response)) throw new AuthError();
    return response.blob();
  }

  async getSigninToken() {
    const response = await fetch(this.getUrl("/user/signin-token"), { ...this.fetchParams(), method: "GET", signal: this.abortController.signal });
    this.updateDeploymentStatus(response);
    if (response.status === 200 && response.ok) return response.json();
    return {};
  }
}

type RequestInit = {
  headers: Record<string, string>;
  mode: "cors";
  credentials: "include";
};

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
    saveLogToSessionStorage("error in tryFetchBlob", error);
    console.log("error.name in tryFetchBlob", error.name);
    if (error instanceof AuthError) window.location.href = "/auth?disconnected=1";
    else capture(error);
    return [error, undefined];
  }
}

const validateEncryptionErrors = [
  "Les données sont en cours de chiffrement par un administrateur. Veuillez patienter, vous reconnecter et réessayer.",
  "La clé de chiffrement a changé ou a été régénérée. Veuillez vous déconnecter et vous reconnecter avec la nouvelle clé.",
  "Une mise-à-jour de vos données a été effectuée, veuillez recharger votre navigateur",
  "Une mise-à-jour de vos données est en cours, veuillez recharger la page dans quelques minutes",
];

export async function tryFetch<T extends ApiResponse>(callback: FetchCallback<T>): Promise<[Error | undefined, T | undefined]> {
  try {
    const result = await callback();
    if (result && !result.ok) return [new Error(result.error), result];
    return [undefined, result];
  } catch (error) {
    saveLogToSessionStorage("error in tryFetch", error);
    console.log("error.name in tryFetch", error.name);
    console.log("signal aborted", API.abortController.signal.aborted);
    console.log("signal aborted reason", API.abortController.signal.reason); // Aborted by navigation
    if (error instanceof AuthError) {
      window.location.href = "/auth?disconnected=1";
    } else if (error.name === "BeforeUnloadAbortError") {
      console.log("BeforeUnloadAbortError", error);
    } else if (API?.abortController?.signal?.reason?.message?.includes?.("Aborted by navigation")) {
      console.log("Reason Signal Aborted by navigation", error);
    } else if (validateEncryptionErrors.includes(error.message)) {
      toast.error(error.message);
    } else {
      capture(error);
    }
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
    console.log("error in tryFetchExpectOk", error);
    console.log("error.name in tryFetchExpectOk", error.name);
    console.log("signal aborted", API.abortController.signal.aborted);
    console.log("signal aborted reason", API.abortController.signal.reason); // Aborted by navigation
    if (error instanceof AuthError) {
      window.location.href = "/auth?disconnected=1";
    } else if (error.name === "BeforeUnloadAbortError") {
      console.log("BeforeUnloadAbortError", error);
    } else if (API?.abortController?.signal?.reason?.message?.includes?.("Aborted by navigation")) {
      console.log("Reason Signal Aborted by navigation", error);
    } else if (validateEncryptionErrors.includes(error.message)) {
      toast.error(error.message);
    } else {
      capture(error);
    }
    return [error, undefined];
  }
}

const API = new Api();
export default API;
