import { HomeView } from "./views/home.tsx";
import { ShapePackingView } from "./views/shape-packing.tsx";

const App = () =>
  [
    "/shape-packing",
    "/shape-packing/",
  ].includes(globalThis.location.pathname) ? (
    <ShapePackingView />
  ) : (
    <HomeView />
  );

export { App };
