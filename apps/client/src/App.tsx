import { NavBar } from "./components/nav-bar";
import { CursorBall } from "./components/cursor-ball";
import { AppRoutes } from "./routes/app-routes";

export function App() {
  return (
    <div className="app-root">
      <NavBar />
      <main className="main-content">
        <AppRoutes />
      </main>
      <CursorBall />
    </div>
  );
}
