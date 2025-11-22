// This file helps VS Code understand Deno globals and imports
// even if the Deno extension is not installed or active.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://*" {
  export const createClient: any;
  const _default: any;
  export default _default;
}

declare module "http/*" {
  export const serve: any;
}
