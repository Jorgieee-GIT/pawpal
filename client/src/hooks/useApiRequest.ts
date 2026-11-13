import { useRef } from "react";
import { API } from "../api";
import type { ApiRequest } from "../types";

/*
 * DOCU: Provide authenticated API request state and actions to a screen.
 * @param {string} token - Authentication token used for the request
 * @param {() => void} onSessionExpired - onSessionExpired value used by this function
 * @returns {ApiRequest} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function useApiRequest(token: string, onSessionExpired: () => void): ApiRequest {
    // Share identical GET requests while they are in flight. Mutations are never cached.
    const pendingGetRequests = useRef(new Map<string, Promise<any>>());

    return async function request(path: string, method = "GET", body?: unknown) {
                /*
         * DOCU: Fetch data for this feature.
         * @throws {Error} - Propagates an error when this operation cannot complete.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const fetchData = async () => {
            const response = await fetch(API + "/api" + path, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: "Bearer " + token } : {})
                },
                body: body === undefined ? undefined : JSON.stringify(body)
            });
            const data = await response.json();

            if (!response.ok) {
                const failure = Object.assign(new Error(data.error || "Request failed"), {
                    status: response.status
                });
                if (
                    response.status === 401 &&
                    token &&
                    localStorage.getItem("pawpal-token") === token
                ) {
                    // An old request must never clear a newer login.
                    localStorage.removeItem("pawpal-token");
                    onSessionExpired();
                }
                throw failure;
            }
            return data;
        };

        if (method !== "GET") {
            return fetchData();
        }
        const key = token + ":" + path;
        const existing = pendingGetRequests.current.get(key);
        if (existing) {
            return existing;
        }
        const promise = fetchData();
        pendingGetRequests.current.set(key, promise);
        try {
            return await promise;
        } finally {
            if (pendingGetRequests.current.get(key) === promise) {
                pendingGetRequests.current.delete(key);
            }
        }
    };
}
