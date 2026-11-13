import { HomeView } from "./views/home.tsx";
import { ShapePackingView } from "./views/semicircle-packing.tsx";

const App = () =>
  [
    "/semicircle-packing",
    "/semicircle-packing/",
    "/shape-packing",
    "/shape-packing/",
  ].includes(globalThis.location.pathname) ? (
    <ShapePackingView />
  ) : (
    <HomeView />
  );

export { App };
