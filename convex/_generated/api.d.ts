/* Boilerplate padrão do Convex — será substituído por `npx convex codegen`
 * assim que houver deployment configurado. */
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as seed from "../seed.js";
import type * as vessels from "../vessels.js";

declare const fullApi: ApiFromModules<{
  seed: typeof seed;
  vessels: typeof vessels;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
