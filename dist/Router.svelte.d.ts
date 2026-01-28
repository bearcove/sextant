import type { Component } from "svelte";
import type { Route } from "./types.js";
interface Props {
    routes: Record<string, Route>;
}
declare const Router: Component<Props, {}, "">;
type Router = ReturnType<typeof Router>;
export default Router;
//# sourceMappingURL=Router.svelte.d.ts.map