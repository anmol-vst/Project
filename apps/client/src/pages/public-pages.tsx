import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth";
import { charityService } from "../services/charity.service";
import { subscriptionService } from "../services/subscription.service";
import type { Charity, SubscriptionPlan } from "../types/models";

export function HomePage() {
  const [featured, setFeatured] = useState<Charity[]>([]);

  useEffect(() => {
    charityService
      .list({ isFeatured: true, page: 1, limit: 3 })
      .then((res) => setFeatured(res.charities))
      .catch(() => undefined);
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <h1>Play Better. Win Monthly. Give Back.</h1>
        <p>
          Emotion-led golf subscription platform combining score tracking, monthly rewards, and
          transparent charity impact.
        </p>
        <div className="row">
          <Link className="btn" to="/signup">
            Create account
          </Link>
          <Link className="btn" to="/pricing">
            Subscribe
          </Link>
          <Link className="btn ghost" to="/charities">
            Explore Charities
          </Link>
        </div>
      </section>
      <section className="grid3">
        <article className="card">
          <h3>Score Journey</h3>
          <p>Submit Stableford scores (1-45). Latest 5 are retained automatically.</p>
        </article>
        <article className="card">
          <h3>Monthly Draw Engine</h3>
          <p>Random or algorithmic draws with 5-match jackpot rollover logic.</p>
        </article>
        <article className="card">
          <h3>Charity-First Impact</h3>
          <p>Choose a charity and route minimum 10% contribution from your plan.</p>
        </article>
      </section>
      <section className="card">
        <h3>Spotlight Charity</h3>
        {featured.length === 0 ? (
          <p className="muted">No featured charity yet.</p>
        ) : (
          featured.map((item) => (
            <p key={item._id}>
              <strong>{item.name}</strong>: {item.shortDescription}
            </p>
          ))
        )}
      </section>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container narrow">
      <h2>Login</h2>
      <form className="card form" onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="err">{error}</p>}
        <button className="btn">Sign in</button>
        <p className="muted">
          New user? <Link to="/signup">Create your account</Link>
        </p>
      </form>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signup(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container narrow">
      <h2>Create account</h2>
      <form className="card form" onSubmit={onSubmit}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="err">{error}</p>}
        <button className="btn">Create account</button>
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    charityService
      .list({ search, category: category || undefined, page: 1, limit: 20 })
      .then((res) => setCharities(res.charities));
  }, [search, category]);

  return (
    <div className="container">
      <h2>Charity Directory</h2>
      <div className="row">
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="health">Health</option>
          <option value="education">Education</option>
          <option value="environment">Environment</option>
          <option value="sports">Sports</option>
          <option value="community">Community</option>
          <option value="animals">Animals</option>
          <option value="arts">Arts</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid3">
        {charities.map((charity) => (
          <article className="card" key={charity._id}>
            <p className="muted">{charity.category}</p>
            <h3>{charity.name}</h3>
            <p>{charity.shortDescription}</p>
            <Link to={`/charities/${charity.slug}`}>View profile</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CharityProfilePage() {
  const { slug } = useParams();
  const [charity, setCharity] = useState<Charity | null>(null);

  useEffect(() => {
    if (!slug) return;
    charityService.getBySlug(slug).then(setCharity);
  }, [slug]);

  if (!charity) return <div className="container">Loading...</div>;
  return (
    <div className="container">
      <article className="card">
        <p className="muted">{charity.category}</p>
        <h2>{charity.name}</h2>
        <p>{charity.description || charity.shortDescription}</p>
      </article>
      <section className="card">
        <h3>Upcoming events</h3>
        {charity.events?.length ? (
          charity.events.map((event) => (
            <p key={event._id}>
              {event.title} - {new Date(event.eventDate).toLocaleDateString()}{" "}
              {event.location ? `(${event.location})` : ""}
            </p>
          ))
        ) : (
          <p className="muted">No upcoming events published.</p>
        )}
      </section>
    </div>
  );
}

export function PricingPage() {
  const { user } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState(10);
  const [cancelMessage, setCancelMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setLoadingCharities(true);
    charityService
      .list({ page: 1, limit: 30 })
      .then((res) => {
        setCharities(res.charities);
        if (res.charities.length > 0) {
          setCharityId(res.charities[0]?._id || "");
        }
      })
      .catch((err) => {
        setError((err as Error).message || "Unable to load charities right now.");
      })
      .finally(() => setLoadingCharities(false));
  }, []);

  const checkout = async (plan: SubscriptionPlan) => {
    if (!user) return;
    if (!charityId) {
      setError("Please select a charity before continuing to payment.");
      return;
    }
    setError("");
    setCancelMessage("");
    setProcessingPlan(plan);
    try {
      const res = await subscriptionService.checkout({
        plan,
        charityId,
        contributionPercent: Math.max(10, contributionPercent),
      });
      window.location.href = res.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const cancelSubscription = async (cancelAt: "immediately" | "period_end") => {
    setError("");
    setCancelMessage("");
    setCancelling(true);
    try {
      const res = await subscriptionService.cancel(cancelAt);
      setCancelMessage(res.message || "Subscription cancellation requested.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container">
      <h2>Subscription Plans</h2>
      {!user && <p>Login first to subscribe.</p>}
      <div className="card form">
        <p className="muted">
          Pick a charity and contribution (minimum 10%), then choose monthly or yearly billing.
        </p>
        <select value={charityId} onChange={(e) => setCharityId(e.target.value)}>
          <option value="">Select charity</option>
          {charities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {loadingCharities && <p className="muted">Loading charities...</p>}
        {!loadingCharities && charities.length === 0 && (
          <p className="err">No active charities available yet. Ask admin to add one first.</p>
        )}
        <input
          type="number"
          min={10}
          max={100}
          value={contributionPercent}
          onChange={(e) => setContributionPercent(Number(e.target.value))}
        />
        <div className="row">
          <button
            className="btn"
            disabled={!user || processingPlan !== null || !charityId || loadingCharities}
            onClick={() => checkout("monthly")}
          >
            {processingPlan === "monthly" ? "Redirecting..." : "Monthly"}
          </button>
          <button
            className="btn ghost"
            disabled={!user || processingPlan !== null || !charityId || loadingCharities}
            onClick={() => checkout("yearly")}
          >
            {processingPlan === "yearly" ? "Redirecting..." : "Yearly"}
          </button>
        </div>
        {user && (
          <div className="row">
            <button className="btn ghost" disabled={cancelling} onClick={() => cancelSubscription("period_end")}>
              Cancel at period end
            </button>
            <button className="btn ghost" disabled={cancelling} onClick={() => cancelSubscription("immediately")}>
              Cancel immediately
            </button>
          </div>
        )}
        {cancelMessage && <p className="ok">{cancelMessage}</p>}
        {error && <p className="err">{error}</p>}
      </div>
    </div>
  );
}
