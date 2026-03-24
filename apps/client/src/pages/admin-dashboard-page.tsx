import { useEffect, useState } from "react";
import { charityService } from "../services/charity.service";
import { drawService } from "../services/draw.service";
import { scoreService } from "../services/score.service";
import { userService } from "../services/user.service";
import { winnerService } from "../services/winner.service";
import type { AppUser, Draw, Winner } from "../types/models";

export function AdminDashboardPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedScoreId, setSelectedScoreId] = useState("");
  const [adminScorePoints, setAdminScorePoints] = useState(20);
  const [drawForm, setDrawForm] = useState({
    title: "",
    month: 1,
    year: new Date().getFullYear(),
    mode: "random" as "random" | "algorithmic",
  });
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "community",
    isFeatured: false,
  });
  const [charityError, setCharityError] = useState("");
  const [charities, setCharities] = useState<Array<{ _id: string; name: string; shortDescription: string }>>([]);

  const load = async () => {
    const [u, d, w, c] = await Promise.all([
      userService.all(),
      drawService.list(),
      winnerService.all(),
      charityService.list({ page: 1, limit: 50 }),
    ]);
    setUsers(u.users);
    setDraws(d);
    setWinners(w);
    setCharities(c.charities.map((item) => ({ _id: item._id, name: item.name, shortDescription: item.shortDescription })));
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <section className="card">
        <h3>Reports</h3>
        <p>Total users: {users.length}</p>
        <p>Total draws: {draws.length}</p>
        <p>Total winners: {winners.length}</p>
        <p>
          Total prize pool (published):{" "}
          {draws
            .reduce(
              (sum, d) =>
                sum + ((d as Draw & { prizePool?: { totalPool?: number } }).prizePool?.totalPool ?? 0),
              0
            )
            .toFixed(2)}
        </p>
        <p>
          Total paid out:{" "}
          {winners.reduce((sum, w) => sum + (w.payoutStatus === "paid" ? w.prizeAmount : 0), 0).toFixed(2)}
        </p>
      </section>

      <section className="card">
        <h3>User Management</h3>
        {users.map((u) => (
          <article key={`${u._id || u.id || u.email}`} className="winner">
            <p>
              {u.name} - {u.email} - {u.role}
            </p>
            <p>
              Subscription: {u.subscription?.status || "-"} / {u.subscription?.plan || "-"}
            </p>
            <div className="row">
              <button
                className="btn ghost"
                onClick={async () => {
                  if (!u._id) return;
                  await userService.adminUpdateUser(u._id, { role: u.role === "admin" ? "user" : "admin" });
                  await load();
                }}
              >
                Toggle role
              </button>
              <button
                className="btn ghost"
                onClick={async () => {
                  if (!u._id) return;
                  await userService.adminUpdateSubscription(u._id, { status: "active", plan: "monthly" });
                  await load();
                }}
              >
                Set active monthly
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Admin Score Edit</h3>
        <div className="row">
          <input
            placeholder="User ID"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          />
          <input
            placeholder="Score ID"
            value={selectedScoreId}
            onChange={(e) => setSelectedScoreId(e.target.value)}
          />
          <input
            type="number"
            min={1}
            max={45}
            value={adminScorePoints}
            onChange={(e) => setAdminScorePoints(Number(e.target.value))}
          />
          <button
            className="btn"
            onClick={async () => {
              if (!selectedUserId || !selectedScoreId) return;
              await scoreService.adminUpdate(selectedUserId, selectedScoreId, { points: adminScorePoints });
            }}
          >
            Update score
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Draw Management</h3>
        <div className="row">
          <input
            placeholder="Title"
            value={drawForm.title}
            onChange={(e) => setDrawForm((p) => ({ ...p, title: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            max={12}
            value={drawForm.month}
            onChange={(e) => setDrawForm((p) => ({ ...p, month: Number(e.target.value) }))}
          />
          <input
            type="number"
            value={drawForm.year}
            onChange={(e) => setDrawForm((p) => ({ ...p, year: Number(e.target.value) }))}
          />
          <select
            value={drawForm.mode}
            onChange={(e) =>
              setDrawForm((p) => ({ ...p, mode: e.target.value as "random" | "algorithmic" }))
            }
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic</option>
          </select>
          <button
            className="btn"
            onClick={async () => {
              await drawService.create(drawForm);
              await load();
            }}
          >
            Create draw
          </button>
        </div>
        {draws.map((d) => (
          <article key={d._id} className="winner">
            <p>
              {d.title} ({d.month}/{d.year}) - {d.status}
            </p>
            <div className="row">
              <button
                className="btn ghost"
                onClick={async () => {
                  await drawService.simulate(d._id);
                  await load();
                }}
              >
                Simulate
              </button>
              <button
                className="btn"
                onClick={async () => {
                  await drawService.publish(d._id);
                  await load();
                }}
              >
                Publish
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Charity Management</h3>
        <div className="form">
          <input
            placeholder="Name"
            value={charityForm.name}
            onChange={(e) => setCharityForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Short description (min 10 characters)"
            value={charityForm.shortDescription}
            onChange={(e) => setCharityForm((p) => ({ ...p, shortDescription: e.target.value }))}
          />
          <textarea
            placeholder="Description (min 20 characters)"
            value={charityForm.description}
            onChange={(e) => setCharityForm((p) => ({ ...p, description: e.target.value }))}
          />
          <select
            value={charityForm.category}
            onChange={(e) => setCharityForm((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="environment">Environment</option>
            <option value="sports">Sports</option>
            <option value="community">Community</option>
            <option value="animals">Animals</option>
            <option value="arts">Arts</option>
            <option value="other">Other</option>
          </select>
          <button
            className="btn"
            onClick={async () => {
              setCharityError("");
              try {
                await charityService.create(charityForm);
                setCharityForm({
                  name: "",
                  description: "",
                  shortDescription: "",
                  category: "community",
                  isFeatured: false,
                });
                await load();
              } catch (err) {
                setCharityError((err as Error).message);
              }
            }}
          >
            Create charity
          </button>
          {charityError && <p className="err">{charityError}</p>}
        </div>
        {charities.map((charity) => (
          <article key={charity._id} className="winner">
            <p>
              {charity.name} - {charity.shortDescription}
            </p>
            <div className="row">
              <button
                className="btn ghost"
                onClick={async () => {
                  await charityService.update(charity._id, { isFeatured: true });
                  await load();
                }}
              >
                Mark featured
              </button>
              <button
                className="btn ghost"
                onClick={async () => {
                  await charityService.remove(charity._id);
                  await load();
                }}
              >
                Delete charity
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Winners Management</h3>
        {winners.map((w) => (
          <article key={w._id} className="winner">
            <p>
              {w.userId?.name || "User"} - {w.tier} - {w.prizeAmount.toFixed(2)}
            </p>
            <p>
              {w.verificationStatus} / {w.payoutStatus}
            </p>
            <div className="row">
              <button
                className="btn"
                onClick={async () => {
                  await winnerService.verify(w._id, "approved");
                  await load();
                }}
              >
                Approve
              </button>
              <button
                className="btn ghost"
                onClick={async () => {
                  await winnerService.verify(w._id, "rejected");
                  await load();
                }}
              >
                Reject
              </button>
              <button
                className="btn"
                onClick={async () => {
                  await winnerService.pay(w._id);
                  await load();
                }}
              >
                Mark paid
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
