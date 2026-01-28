import { getContext, setContext } from "svelte";
import type { Route, RouteParams, RouterContext } from "./types.js";
import { serializePath, serializeQuery } from "./router.js";

const ROUTER_KEY = Symbol("dibs-router");

/** Current path state - shared across all router instances */
let currentPath = $state(
  typeof window !== "undefined" ? window.location.pathname : "/"
);
let currentQuery = $state(
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
);

/** Initialize browser history listener (call once at app root) */
export function initRouter() {
  if (typeof window === "undefined") return;

  const handlePopState = () => {
    currentPath = window.location.pathname;
    currentQuery = new URLSearchParams(window.location.search);
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}

/** Get current path (reactive) */
export function getCurrentPath(): string {
  return currentPath;
}

/** Get current query params (reactive) */
export function getCurrentQuery(): URLSearchParams {
  return currentQuery;
}

/** Navigate to a new URL */
function navigateTo(path: string, query?: URLSearchParams) {
  const url = query?.toString() ? `${path}?${query}` : path;
  window.history.pushState(null, "", url);
  currentPath = path;
  currentQuery = query ?? new URLSearchParams();
}

/** Set router context for nested routes */
export function setRouterContext(ctx: RouterContext) {
  setContext(ROUTER_KEY, ctx);
}

/** Get router context (returns undefined at root level) */
export function getRouterContext(): RouterContext | undefined {
  try {
    return getContext<RouterContext>(ROUTER_KEY);
  } catch {
    return undefined;
  }
}

/**
 * Get a navigate function scoped to the current router context.
 */
export function useNavigate() {
  const ctx = getRouterContext();
  const basePath = ctx?.basePath ?? "";

  return function navigate<R extends Route>(
    route: R,
    params: RouteParams<R>
  ): void {
    // Separate path params from query params
    const pathParams: Record<string, string | number> = {};
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(params as Record<string, any>)) {
      // Check if this is a path param by looking for :key in the route path
      if (route.path.includes(`:${key}`)) {
        pathParams[key] = value;
      } else {
        queryParams[key] = value;
      }
    }

    const relativePath = serializePath(route.path, pathParams);
    const fullPath = basePath + relativePath;
    const queryString = serializeQuery(queryParams, route.query);

    const url = fullPath + queryString;
    window.history.pushState(null, "", url);
    currentPath = fullPath;
    currentQuery = new URLSearchParams(queryString.slice(1));
  };
}

/**
 * Update query params without changing the path.
 */
export function useSetQuery() {
  return function setQuery(
    params: Record<string, string | number | boolean | undefined>
  ): void {
    const newQuery = new URLSearchParams(currentQuery);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        newQuery.delete(key);
      } else {
        newQuery.set(key, String(value));
      }
    }

    navigateTo(currentPath, newQuery);
  };
}

/**
 * Get the current route match info.
 * Returns reactive state that updates when URL changes.
 */
export function useRoute() {
  const ctx = getRouterContext();

  return {
    get basePath() {
      return ctx?.basePath ?? "";
    },
    get path() {
      return currentPath;
    },
    get query() {
      return currentQuery;
    },
    get relativePath() {
      const base = ctx?.basePath ?? "";
      return currentPath.startsWith(base)
        ? currentPath.slice(base.length) || "/"
        : currentPath;
    },
  };
}
