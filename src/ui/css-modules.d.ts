// CSS Modules are resolved by Vite; this declaration types their class maps for tsc.
declare module "*.module.css" {
  const classes: { readonly [className: string]: string };
  export default classes;
}
