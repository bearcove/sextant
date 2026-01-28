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
export function defineRoutes(defs) {
    var _a;
    var routes = {};
    for (var _i = 0, _b = Object.entries(defs); _i < _b.length; _i++) {
        var _c = _b[_i], name = _c[0], def = _c[1];
        routes[name] = {
            name: name,
            path: def.path,
            query: (_a = def.query) !== null && _a !== void 0 ? _a : {},
            component: def.component,
        };
    }
    return routes;
}
/**
 * Parse path params from a URL path given a pattern.
 * Pattern: "/:table/:pk" + Path: "/products/123" → { table: "products", pk: "123" }
 */
export function matchPath(pattern, path) {
    // Handle wildcard patterns (e.g., "/admin/*")
    var isWildcard = pattern.endsWith("/*");
    var cleanPattern = isWildcard ? pattern.slice(0, -2) : pattern;
    var patternParts = cleanPattern.split("/").filter(Boolean);
    var pathParts = path.split("/").filter(Boolean);
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
    var params = {};
    for (var i = 0; i < patternParts.length; i++) {
        var patternPart = patternParts[i];
        var pathPart = pathParts[i];
        if (patternPart.startsWith(":")) {
            // Dynamic segment
            var paramName = patternPart.slice(1);
            params[paramName] = decodeURIComponent(pathPart);
        }
        else if (patternPart !== pathPart) {
            // Static segment mismatch
            return null;
        }
    }
    // Calculate consumed path
    var consumed = "/" + patternParts
        .map(function (part, i) { return pathParts[i]; })
        .join("/");
    return { params: params, consumed: consumed === "/" ? "" : consumed };
}
/**
 * Parse query parameters according to their definitions.
 */
export function parseQuery(search, defs) {
    var result = {};
    for (var _i = 0, _a = Object.entries(defs); _i < _a.length; _i++) {
        var _b = _a[_i], name = _b[0], def = _b[1];
        var value = search.get(name);
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
function parseQueryValue(value, def) {
    var _a;
    switch (def.type) {
        case "number": {
            var num = Number(value);
            return isNaN(num) ? ((_a = def.default) !== null && _a !== void 0 ? _a : 0) : num;
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
export function serializePath(pattern, params) {
    var path = pattern;
    // Remove wildcard suffix for serialization
    if (path.endsWith("/*")) {
        path = path.slice(0, -2);
    }
    // Replace :param with actual values
    for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        path = path.replace(":".concat(key), encodeURIComponent(String(value)));
    }
    return path || "/";
}
/**
 * Serialize query params to a query string.
 */
export function serializeQuery(params, defs) {
    var searchParams = new URLSearchParams();
    for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value === undefined)
            continue;
        // Skip if it's the default value
        var def = defs[key];
        if ((def === null || def === void 0 ? void 0 : def.default) !== undefined && value === def.default)
            continue;
        searchParams.set(key, String(value));
    }
    var str = searchParams.toString();
    return str ? "?".concat(str) : "";
}
/**
 * Find the first matching route.
 */
export function matchRoutes(routes, path, search) {
    // Sort routes by specificity (more static segments first, wildcards last)
    var sortedRoutes = Object.values(routes).sort(function (a, b) {
        var aWildcard = a.path.endsWith("/*");
        var bWildcard = b.path.endsWith("/*");
        if (aWildcard !== bWildcard)
            return aWildcard ? 1 : -1;
        // More segments = more specific
        var aSegments = a.path.split("/").filter(Boolean).length;
        var bSegments = b.path.split("/").filter(Boolean).length;
        return bSegments - aSegments;
    });
    for (var _i = 0, sortedRoutes_1 = sortedRoutes; _i < sortedRoutes_1.length; _i++) {
        var route = sortedRoutes_1[_i];
        var match = matchPath(route.path, path);
        if (match) {
            var queryParams = parseQuery(search, route.query);
            return {
                route: route,
                params: match.params,
                queryParams: queryParams,
                consumedPath: match.consumed,
            };
        }
    }
    return null;
}
