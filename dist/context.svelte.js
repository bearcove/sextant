import { getContext, setContext } from "svelte";
import { serializePath, serializeQuery } from "./router.js";
var ROUTER_KEY = Symbol("dibs-router");
/** Current path state - shared across all router instances */
var currentPath = $state(typeof window !== "undefined" ? window.location.pathname : "/");
var currentQuery = $state(typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams());
/** Initialize browser history listener (call once at app root) */
export function initRouter() {
    if (typeof window === "undefined")
        return;
    var handlePopState = function () {
        currentPath = window.location.pathname;
        currentQuery = new URLSearchParams(window.location.search);
    };
    window.addEventListener("popstate", handlePopState);
    return function () {
        window.removeEventListener("popstate", handlePopState);
    };
}
/** Get current path (reactive) */
export function getCurrentPath() {
    return currentPath;
}
/** Get current query params (reactive) */
export function getCurrentQuery() {
    return currentQuery;
}
/** Navigate to a new URL */
function navigateTo(path, query) {
    var url = (query === null || query === void 0 ? void 0 : query.toString()) ? "".concat(path, "?").concat(query) : path;
    window.history.pushState(null, "", url);
    currentPath = path;
    currentQuery = query !== null && query !== void 0 ? query : new URLSearchParams();
}
/** Set router context for nested routes */
export function setRouterContext(ctx) {
    setContext(ROUTER_KEY, ctx);
}
/** Get router context (returns undefined at root level) */
export function getRouterContext() {
    try {
        return getContext(ROUTER_KEY);
    }
    catch (_a) {
        return undefined;
    }
}
/**
 * Get a navigate function scoped to the current router context.
 */
export function useNavigate() {
    var _a;
    var ctx = getRouterContext();
    var basePath = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.basePath) !== null && _a !== void 0 ? _a : "";
    return function navigate(route, params) {
        // Separate path params from query params
        var pathParams = {};
        var queryParams = {};
        for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // Check if this is a path param by looking for :key in the route path
            if (route.path.includes(":".concat(key))) {
                pathParams[key] = value;
            }
            else {
                queryParams[key] = value;
            }
        }
        var relativePath = serializePath(route.path, pathParams);
        var fullPath = basePath + relativePath;
        var queryString = serializeQuery(queryParams, route.query);
        var url = fullPath + queryString;
        window.history.pushState(null, "", url);
        currentPath = fullPath;
        currentQuery = new URLSearchParams(queryString.slice(1));
    };
}
/**
 * Update query params without changing the path.
 */
export function useSetQuery() {
    return function setQuery(params) {
        var newQuery = new URLSearchParams(currentQuery);
        for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value === undefined) {
                newQuery.delete(key);
            }
            else {
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
    var ctx = getRouterContext();
    return {
        get basePath() {
            var _a;
            return (_a = ctx === null || ctx === void 0 ? void 0 : ctx.basePath) !== null && _a !== void 0 ? _a : "";
        },
        get path() {
            return currentPath;
        },
        get query() {
            return currentQuery;
        },
        get relativePath() {
            var _a;
            var base = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.basePath) !== null && _a !== void 0 ? _a : "";
            return currentPath.startsWith(base)
                ? currentPath.slice(base.length) || "/"
                : currentPath;
        },
    };
}
