import type { Route, RouteParams, RouterContext } from "./types.js";
/** Initialize browser history listener (call once at app root) */
export declare function initRouter(): () => void;
/** Get current path (reactive) */
export declare function getCurrentPath(): string;
/** Get current query params (reactive) */
export declare function getCurrentQuery(): URLSearchParams;
/** Set router context for nested routes */
export declare function setRouterContext(ctx: RouterContext): void;
/** Get router context (returns undefined at root level) */
export declare function getRouterContext(): RouterContext | undefined;
/**
 * Get a navigate function scoped to the current router context.
 */
export declare function useNavigate(): <R extends Route>(route: R, params: RouteParams<R>) => void;
/**
 * Update query params without changing the path.
 */
export declare function useSetQuery(): (params: Record<string, string | number | boolean | undefined>) => void;
/**
 * Get the current route match info.
 * Returns reactive state that updates when URL changes.
 */
export declare function useRoute(): {
    readonly basePath: string;
    readonly path: string;
    readonly query: URLSearchParams;
    readonly relativePath: string;
};
//# sourceMappingURL=context.svelte.d.ts.map