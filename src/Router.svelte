<script lang="ts">
  import type { Component } from "svelte";
  import type { Route, RouterContext } from "./types.js";
  import { matchRoutes } from "./router.js";
  import {
    getCurrentPath,
    getCurrentQuery,
    getRouterContext,
    setRouterContext,
    initRouter,
  } from "./context.svelte.js";
  import { onMount } from "svelte";

  interface Props {
    routes: Record<string, Route>;
  }

  let { routes }: Props = $props();

  // Initialize router at the root level
  const parentCtx = getRouterContext();
  const isRoot = !parentCtx;

  onMount(() => {
    if (isRoot) {
      return initRouter();
    }
  });

  // Calculate base path from parent context
  const basePath = $derived(parentCtx?.basePath ?? "");

  // Get current URL state
  const currentPath = $derived(getCurrentPath());
  const currentQuery = $derived(getCurrentQuery());

  // Calculate the path relative to our base
  const relativePath = $derived(
    currentPath.startsWith(basePath)
      ? currentPath.slice(basePath.length) || "/"
      : currentPath
  );

  // Match against our routes
  const match = $derived(matchRoutes(routes, relativePath, currentQuery));

  // Set context for child components.
  // basePath stays the same (what parent consumed) - NOT including our consumed path.
  // This way navigation to sibling routes within this Router works correctly.
  // Only nested Routers (via wildcard routes) get an extended basePath.
  const childBasePath = $derived(
    match?.route.path.endsWith("/*")
      ? basePath + match.consumedPath.replace(/\/\*$/, "")
      : basePath
  );

  $effect(() => {
    if (match) {
      setRouterContext({
        basePath: childBasePath,
        currentPath,
        currentQuery,
        navigate: (path, query) => {
          const url = query
            ? `${basePath}${path}?${new URLSearchParams(query)}`
            : `${basePath}${path}`;
          window.history.pushState(null, "", url);
        },
      });
    }
  });

  // Combine path and query params for the component
  const componentProps = $derived(
    match ? { ...match.params, ...match.queryParams } : {}
  );
</script>

{#if match}
  {@const MatchedComponent = match.route.component}
  <MatchedComponent {...componentProps} />
{/if}
