import type { Component } from "svelte";
import type { Route, Routes, QueryDefs, RouteMatch } from "./types.js";
/** Route config shape for type inference (path + query only) */
type RouteConfig = {
    path: string;
    query?: QueryDefs;
};
/** Full input with component added */
type RouteWithComponent<T extends RouteConfig> = T & {
    component: Component<any>;
};
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
export declare function defineRoutes<const T extends Record<string, RouteConfig>>(defs: {
    [K in keyof T]: RouteWithComponent<T[K]>;
}): Routes<T>;
/**
 * Parse path params from a URL path given a pattern.
 * Pattern: "/:table/:pk" + Path: "/products/123" → { table: "products", pk: "123" }
 */
export declare function matchPath(pattern: string, path: string): {
    params: Record<string, string>;
    consumed: string;
} | null;
/**
 * Parse query parameters according to their definitions.
 */
export declare function parseQuery(search: URLSearchParams, defs: QueryDefs): Record<string, string | number | boolean>;
/**
 * Serialize params to a URL path.
 */
export declare function serializePath(pattern: string, params: Record<string, string | number>): string;
/**
 * Serialize query params to a query string.
 */
export declare function serializeQuery(params: Record<string, string | number | boolean | undefined>, defs: QueryDefs): string;
/**
 * Find the first matching route.
 */
export declare function matchRoutes<T extends Record<string, Route>>(routes: T, path: string, search: URLSearchParams): RouteMatch | null;
export {};
//# sourceMappingURL=router.d.ts.map