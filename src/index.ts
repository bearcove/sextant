// Core
export { defineRoutes, matchPath, matchRoutes, serializePath, serializeQuery, parseQuery } from "./router.js";

// Types
export type {
  Route,
  RouteDef,
  Routes,
  RouteParams,
  RouteMatch,
  RouterContext,
  QueryDefs,
  QueryParamDef,
  QueryParamType,
} from "./types.js";

// Svelte components
export { default as Router } from "./Router.svelte";

// Hooks
export {
  useNavigate,
  useSetQuery,
  useRoute,
  initRouter,
  getRouterContext,
  getCurrentPath,
  getCurrentQuery,
} from "./context.svelte.js";
