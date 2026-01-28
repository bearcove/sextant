import type { Component } from "svelte";
import type {
  RouteDef,
  Route,
  Routes,
  QueryDefs,
  QueryParamDef,
  RouteMatch,
} from "./types.js";

/** Route config shape for type inference (path + query only) */
type RouteConfig = { path: string; query?: QueryDefs };

/** Full input with component added */
type RouteWithComponent<T extends RouteConfig> = T & { component: Component<any> };

/**
 * Define routes with full type inference for path and query params.
 * Component types are erased to Component<any> to avoid leaking internal Svelte types.
 *
 * @example
 * const routes = defineRoutes({
 *   dashboard: { path: "/", component: Dashboard },
 *   tableList: {
 *     path: "/:table",
 *     query: { page: { type: "number", default: 1 } },
 *     component: TableList,
 *   },
 *   rowDetail: { path: "/:table/:pk", component: RowDetail },
 * });
 */
export function defineRoutes<const T extends Record<string, RouteConfig>>(
  defs: { [K in keyof T]: RouteWithComponent<T[K]> }
): Routes<T> {
  const routes = {} as Routes<T>;

  for (const [name, def] of Object.entries(defs)) {
    (routes as any)[name] = {
      name,
      path: def.path,
      query: def.query ?? {},
      component: def.component,
    } satisfies Route;
  }

  return routes;
}

/**
 * Parse path params from a URL path given a pattern.
 * Pattern: "/:table/:pk" + Path: "/products/123" → { table: "products", pk: "123" }
 */
export function matchPath(
  pattern: string,
  path: string
): { params: Record<string, string>; consumed: string } | null {
  // Handle wildcard patterns (e.g., "/admin/*")
  const isWildcard = pattern.endsWith("/*");
  const cleanPattern = isWildcard ? pattern.slice(0, -2) : pattern;

  const patternParts = cleanPattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  // For non-wildcard, must match exactly (or pattern can be shorter if it's a prefix match)
  if (!isWildcard && pathParts.length !== patternParts.length) {
    // Check if this is an exact match scenario
    if (patternParts.length > pathParts.length) {
      return null;
    }
    // For non-wildcard, require exact length match
    if (patternParts.length !== pathParts.length) {
      return null;
    }
  }

  // For wildcard, pattern parts must be a prefix of path parts
  if (isWildcard && pathParts.length < patternParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      // Dynamic segment
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      // Static segment mismatch
      return null;
    }
  }

  // Calculate consumed path
  const consumed = "/" + patternParts
    .map((part, i) => pathParts[i])
    .join("/");

  return { params, consumed: consumed === "/" ? "" : consumed };
}

/**
 * Parse query parameters according to their definitions.
 */
export function parseQuery(
  search: URLSearchParams,
  defs: QueryDefs
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const [name, def] of Object.entries(defs)) {
    const value = search.get(name);

    if (value === null) {
      // Use default if available
      if (def.default !== undefined) {
        result[name] = def.default;
      }
      continue;
    }

    // Parse according to type
    result[name] = parseQueryValue(value, def);
  }

  return result;
}

function parseQueryValue(
  value: string,
  def: QueryParamDef
): string | number | boolean {
  switch (def.type) {
    case "number": {
      const num = Number(value);
      return isNaN(num) ? (def.default as number ?? 0) : num;
    }
    case "boolean":
      return value === "true" || value === "1";
    default:
      return value;
  }
}

/**
 * Serialize params to a URL path.
 */
export function serializePath(
  pattern: string,
  params: Record<string, string | number>
): string {
  let path = pattern;

  // Remove wildcard suffix for serialization
  if (path.endsWith("/*")) {
    path = path.slice(0, -2);
  }

  // Replace :param with actual values
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, encodeURIComponent(String(value)));
  }

  return path || "/";
}

/**
 * Serialize query params to a query string.
 */
export function serializeQuery(
  params: Record<string, string | number | boolean | undefined>,
  defs: QueryDefs
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    // Skip if it's the default value
    const def = defs[key];
    if (def?.default !== undefined && value === def.default) continue;

    searchParams.set(key, String(value));
  }

  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

/**
 * Find the first matching route.
 */
export function matchRoutes<T extends Record<string, Route>>(
  routes: T,
  path: string,
  search: URLSearchParams
): RouteMatch | null {
  // Sort routes by specificity (more static segments first, wildcards last)
  const sortedRoutes = Object.values(routes).sort((a, b) => {
    const aWildcard = a.path.endsWith("/*");
    const bWildcard = b.path.endsWith("/*");
    if (aWildcard !== bWildcard) return aWildcard ? 1 : -1;

    // More segments = more specific
    const aSegments = a.path.split("/").filter(Boolean).length;
    const bSegments = b.path.split("/").filter(Boolean).length;
    return bSegments - aSegments;
  });

  for (const route of sortedRoutes) {
    const match = matchPath(route.path, path);
    if (match) {
      const queryParams = parseQuery(search, route.query);
      return {
        route,
        params: match.params,
        queryParams,
        consumedPath: match.consumed,
      };
    }
  }

  return null;
}
