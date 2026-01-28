import type { Component } from "svelte";
/** Query parameter type definitions */
export type QueryParamType = "string" | "number" | "boolean";
export interface QueryParamDef {
    type: QueryParamType;
    optional?: boolean;
    default?: string | number | boolean;
}
export type QueryDefs = Record<string, QueryParamDef>;
/** Extract param names from a path pattern like "/:table/:pk" */
export type ExtractPathParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}` ? Param | ExtractPathParams<`/${Rest}`> : T extends `${string}:${infer Param}` ? Param : never;
/** Convert query defs to their TypeScript types */
export type QueryParamValue<T extends QueryParamDef> = T["type"] extends "number" ? number : T["type"] extends "boolean" ? boolean : string;
export type QueryParams<T extends QueryDefs> = {
    [K in keyof T as T[K]["optional"] extends true ? never : T[K]["default"] extends undefined ? K : never]: QueryParamValue<T[K]>;
} & {
    [K in keyof T as T[K]["optional"] extends true ? K : T[K]["default"] extends undefined ? never : K]?: QueryParamValue<T[K]>;
};
/** Route definition input */
export interface RouteDef<Path extends string = string, Query extends QueryDefs = QueryDefs> {
    path: Path;
    query?: Query;
    component: Component<any>;
}
/** Compiled route with type info */
export interface Route<Path extends string = string, Query extends QueryDefs = QueryDefs> {
    readonly name: string;
    readonly path: Path;
    readonly query: Query;
    readonly component: Component<any>;
    readonly _pathParams: ExtractPathParams<Path>;
    readonly _queryParams: Query;
}
/** All params for a route (path + query combined) */
export type RouteParams<R extends Route> = Record<R["_pathParams"], string> & (R["_queryParams"] extends QueryDefs ? QueryParams<R["_queryParams"]> : {});
/**
 * Routes object returned by defineRoutes.
 * Extracts path/query types but erases component to Component<any> to avoid leaking internal Svelte types.
 */
export type Routes<T extends Record<string, {
    path: string;
    query?: QueryDefs;
}>> = {
    [K in keyof T]: Route<T[K] extends {
        path: infer P extends string;
    } ? P : string, T[K] extends {
        query: infer Q extends QueryDefs;
    } ? Q : {}>;
};
/** Router context passed through component tree */
export interface RouterContext {
    basePath: string;
    currentPath: string;
    currentQuery: URLSearchParams;
    navigate: (path: string, query?: Record<string, string>) => void;
}
/** Match result when a route matches the current URL */
export interface RouteMatch<R extends Route = Route> {
    route: R;
    params: Record<string, string>;
    queryParams: Record<string, string | number | boolean>;
    consumedPath: string;
}
//# sourceMappingURL=types.d.ts.map