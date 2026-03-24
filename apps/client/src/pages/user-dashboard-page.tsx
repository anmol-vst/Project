import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth";
import { authService } from "../services/auth.service";
import { scoreService } from "../services/score.service";
import { userService } from "../services/user.service";
import { winnerService } from "../services/winner.service";
import type { Score, Winner } from "../types/models";

export function UserDashboardPage() {
  const { user, refreshMe } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [winnings, setWinnings] = useState<Winner[]>([]);
  const [points, setPoints] = useState(30);
  const [datePlayed, setDatePlayed] = useState("");
  const [proofUrl, setProofUrl] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { points: number; datePlayed: string }>>({});

  const active = user?.subscription?.status === "active";

  const loadData = useCallback(async () => {
    try {
      const me = await refreshMe();
      const isActive = me?.subscription?.status === "active";
      const [sc, wn] = await Promise.all([
        isActive ? scoreService.list() : Promise.resolve([]),
        winnerService.myWinnings(),
      ]);
      setScores(sc);
      setWinnings(wn);
    } catch {
      try {
        setScores([]);
        const wn = await winnerService.myWinnings();
        setWinnings(wn);
      } catch {
        setWinnings([]);
      }
    }
  }, [refreshMe]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") !== "true") return;

    let cancelled = false;
    void (async () => {
      for (let i = 0; i < 25 && !cancelled; i++) {
        try {
          const me = await refreshMe();
          if (me?.subscription?.status === "active") {
            const [sc, wn] = await Promise.all([scoreService.list(), winnerService.myWinnings()]);
            setScores(sc);
            setWinnings(wn);
            window.history.replaceState({}, "", "/dashboard");
            setMessage("Payment confirmed. Score entry is unlocked.");
            break;
          }
        } catch {
          /* webhook may lag */
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  useEffect(() => {
    if (user?.subscription?.status !== "active") {
      setScores([]);
      return;
    }
    scoreService.list().then(setScores).catch(() => undefined);
  }, [user?.subscription?.status]);

  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    setScoreDrafts(
      Object.fromEntries(
        scores.map((s) => [
          s._id,
          {
            points: s.points,
            datePlayed: new Date(s.datePlayed).toISOString().slice(0, 10),
          },
        ])
      )
    );
  }, [scores]);

  const addScore = async (e: FormEvent) => {
    e.preventDefault();
    await scoreService.add({ points, datePlayed });
    await loadData();
    setMessage("Score saved. Latest 5 logic is applied by backend.");
  };

  const updateScore = async (scoreId: string) => {
    const draft = scoreDrafts[scoreId];
    if (!draft) return;
    await scoreService.update(scoreId, { points: draft.points, datePlayed: draft.datePlayed });
    await loadData();
  };

  const deleteScore = async (scoreId: string) => {
    await scoreService.remove(scoreId);
    await loadData();
  };

  const submitProof = async (winnerId: string) => {
    await winnerService.uploadProof(winnerId, proofUrl[winnerId] || "");
    await loadData();
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    await authService.changePassword({ currentPassword, newPassword, confirmPassword });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password updated successfully.");
  };

  const totalWon = useMemo(
    () => winnings.reduce((sum, item) => sum + Number(item.prizeAmount || 0), 0),
    [winnings]
  );

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    await userService.updateMyProfile({ name: profileName });
    await refreshMe();
    setMessage("Profile updated.");
  };

  return (
    <div className="container">
      <h2>User Dashboard</h2>
      <div className="grid3">
        <article className="card">
          <h3>Subscription</h3>
          <p>Status: {user?.subscription?.status || "inactive"}</p>
          <p>Plan: {user?.subscription?.plan || "-"}</p>
          <p>
            Renewal:{" "}
            {user?.subscription?.currentPeriodEnd
              ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
              : "-"}
          </p>
          {user?.subscription?.status !== "active" && <Link to="/pricing">Activate now</Link>}
        </article>
        <article className="card">
          <h3>Charity</h3>
          <p>Selected: {user?.charityContribution?.charityId?.name || "Not selected"}</p>
          <p>Contribution: {user?.charityContribution?.contributionPercent ?? 10}%</p>
        </article>
        <article className="card">
          <h3>Participation</h3>
          <p>Winnings records: {winnings.length}</p>
          <p>Total won: {totalWon.toFixed(2)}</p>
          <p>Draw entries: {winnings.length}</p>
          <p>Upcoming draws: Monthly (admin published cadence)</p>
        </article>
      </div>

      <section className="card">
        <h3>Profile Settings</h3>
        <form className="row" onSubmit={saveProfile}>
          <input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          <button className="btn">Save profile</button>
        </form>
      </section>

      <section className="card">
        <h3>Scores (Stableford 1-45)</h3>
        <p className="muted">Only your latest 5 scores are kept. New score replaces the oldest automatically.</p>
        {!active ? (
          <p>Active subscription required for score features.</p>
        ) : (
          <form className="row" onSubmit={addScore}>
            <input
              type="number"
              min={1}
              max={45}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
            <input type="date" value={datePlayed} onChange={(e) => setDatePlayed(e.target.value)} />
            <button className="btn">Add</button>
          </form>
        )}
        <ul>
          {scores.map((s) => (
            <li key={s._id} className="row">
              <input
                type="number"
                min={1}
                max={45}
                value={scoreDrafts[s._id]?.points ?? s.points}
                onChange={(e) =>
                  setScoreDrafts((prev) => ({
                    ...prev,
                    [s._id]: {
                      points: Number(e.target.value),
                      datePlayed: prev[s._id]?.datePlayed || new Date(s.datePlayed).toISOString().slice(0, 10),
                    },
                  }))
                }
              />
              <input
                type="date"
                value={scoreDrafts[s._id]?.datePlayed ?? new Date(s.datePlayed).toISOString().slice(0, 10)}
                onChange={(e) =>
                  setScoreDrafts((prev) => ({
                    ...prev,
                    [s._id]: {
                      points: prev[s._id]?.points ?? s.points,
                      datePlayed: e.target.value,
                    },
                  }))
                }
              />
              <button className="btn ghost" onClick={() => updateScore(s._id)}>
                Save edit
              </button>
              <button className="btn ghost" onClick={() => deleteScore(s._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Winners</h3>
        {winnings.map((w) => (
          <article key={w._id} className="winner">
            <p>
              {w.drawId?.title || "Draw"} - {w.tier} - {w.prizeAmount.toFixed(2)}
            </p>
            <p>
              Verification: {w.verificationStatus} | Payout: {w.payoutStatus}
            </p>
            {w.verificationStatus === "pending_proof" && (
              <div className="row">
                <input
                  placeholder="Proof URL"
                  value={proofUrl[w._id] || ""}
                  onChange={(e) => setProofUrl((p) => ({ ...p, [w._id]: e.target.value }))}
                />
                <button className="btn" onClick={() => submitProof(w._id)}>
                  Submit proof
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Change Password</h3>
        <form className="form" onSubmit={changePassword}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="btn">Update password</button>
        </form>
        {message && <p className="ok">{message}</p>}
      </section>
    </div>
  );
}
