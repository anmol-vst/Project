import { NavBar } from "./components/nav-bar";
import { AppRoutes } from "./routes/app-routes";

export function App() {
  return (
    <div className="app-root">
      <NavBar />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}
