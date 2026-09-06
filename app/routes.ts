import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

// Keeps the existing app/routes/* file-naming convention from Remix.
export default flatRoutes() satisfies RouteConfig;
