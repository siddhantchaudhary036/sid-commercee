/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiConversations from "../aiConversations.js";
import type * as campaigns from "../campaigns.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as flows from "../flows.js";
import type * as insights from "../insights.js";
import type * as migrations from "../migrations.js";
import type * as seed from "../seed.js";
import type * as segments from "../segments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiConversations: typeof aiConversations;
  campaigns: typeof campaigns;
  customers: typeof customers;
  dashboard: typeof dashboard;
  emailTemplates: typeof emailTemplates;
  flows: typeof flows;
  insights: typeof insights;
  migrations: typeof migrations;
  seed: typeof seed;
  segments: typeof segments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
