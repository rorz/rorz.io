import { BlackView } from "./views/black.tsx";
import { ShapePackingView } from "./views/shape-packing.tsx";

const App = () =>
  [
    "/shape-packing",
    "/shape-packing/",
  ].includes(globalThis.location.pathname) ? (
    <ShapePackingView />
  ) : (
    <BlackView />
  );

export { App };
