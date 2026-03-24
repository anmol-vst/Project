import { NavBar } from "./components/nav-bar";
import { CursorBall } from "./components/cursor-ball";
import { AppRoutes } from "./routes/app-routes";

export function App() {
  return (
    <div>
      <NavBar />
      <AppRoutes />
      <CursorBall />
    </div>
  );
}
