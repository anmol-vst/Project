import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth";
import { charityService } from "../services/charity.service";
import { subscriptionService } from "../services/subscription.service";
import type { Charity, SubscriptionPlan } from "../types/models";

export function HomePage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Charity[]>([]);

  useEffect(() => {
    charityService
      .list({ isFeatured: true, page: 1, limit: 3 })
      .then((res) => setFeatured(res.charities))
      .catch(() => undefined);
  }, []);

  const scoreTarget = user ? "/dashboard" : "/signup";
  const drawTarget = user ? "/dashboard" : "/pricing";
  return (
    <div className="container">
      <section className="hero hero-golf">
        <div className="hero-content">
          <p className="hero-eyebrow">Golf subscription - purpose over par</p>
          <h1>Play with purpose. Compete monthly. Lift communities.</h1>
          <p className="hero-lead">
            Stableford scorekeeping, monthly draw excitement, and transparent charity impact in one
            modern experience.
          </p>
          <div className="row hero-actions">
            <Link className="btn btn-primary" to="/signup">Join the tee sheet</Link>
            <Link className="btn btn-secondary" to="/pricing">See membership</Link>
            <Link className="btn ghost btn-outline" to="/charities">Browse charities</Link>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=400&fit=crop"
          alt="Golf at sunset"
          className="hero-img"
        />
      </section>
      <section className="home-features">
        <article className="feature-card feature-card--scores">
          <img src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=200&fit=crop" alt="Golf score" className="card-img" />
          <span className="feature-kicker">01 · Score journey</span>
          <h3>Your latest five rounds, always current</h3>
          <p>Record Stableford scores (1-45) with date played. Oldest score rotates out automatically after five.</p>
          <Link className="feature-link" to={scoreTarget}>{user ? "Open score log" : "Start scoring"}</Link>
        </article>
        <article className="feature-card feature-card--draw">
          <img src="https://images.unsplash.com/photo-1592919505780-303950717480?w=400&h=200&fit=crop" alt="Prize draw" className="card-img" />
          <span className="feature-kicker">02 · Monthly draw</span>
          <h3>Prize tiers with jackpot rollover</h3>
          <p>Monthly draw workflows support random/algorithmic logic and rollover when no top-tier winner appears.</p>
          <Link className="feature-link" to={drawTarget}>{user ? "Go to dashboard" : "Unlock draws with membership"}</Link>
        </article>
        <article className="feature-card feature-card--charity">
          <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=200&fit=crop" alt="Charity giving" className="card-img" />
          <span className="feature-kicker">03 · Charity-first impact</span>
          <h3>Giving built into the plan</h3>
          <p>Select a partner charity and route at least 10% of your subscription to social impact.</p>
          <Link className="feature-link" to="/charities">Meet charities</Link>
        </article>
      </section>
      <section className="card spotlight-card">
        <div className="spotlight-header">
          <h3>Spotlight charities</h3>
          <Link className="text-link" to="/charities">Full directory</Link>
        </div>
        {featured.length === 0 ? (
          <p className="muted">No featured charity yet.</p>
        ) : (
          <ul className="spotlight-list">
            {featured.map((item) => (
              <li key={item._id}>
                <Link to={`/charities/${item.slug}`} className="spotlight-link">
                  <strong>{item.name}</strong>
                  <span className="muted">{item.shortDescription}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginAs, setLoginAs] = useState<"subscriber" | "admin">("subscriber");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const loggedInUser = await login(email, password);
      if (loginAs === "admin") {
        if (loggedInUser.role !== "admin") {
          logout();
          setError("This account is not an admin. Please use Subscriber login.");
          return;
        }
        navigate("/admin");
        return;
      }
      if (loggedInUser.role === "admin") {
        navigate("/admin");
        return;
      }
      if (loggedInUser.subscription?.status !== "active") {
        navigate("/pricing");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container narrow">
      <h2>Login</h2>
      <form className="card form" onSubmit={onSubmit}>
        <div className="row">
          <button
            type="button"
            className={loginAs === "subscriber" ? "btn" : "btn ghost"}
            onClick={() => setLoginAs("subscriber")}
          >
            Subscriber login
          </button>
          <button
            type="button"
            className={loginAs === "admin" ? "btn" : "btn ghost"}
            onClick={() => setLoginAs("admin")}
          >
            Admin login
          </button>
        </div>
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
      navigate("/pricing");
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
  const [charityId, setCharityId] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [error, setError] = useState("");
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    charityService
      .list({ page: 1, limit: 30 })
      .then((res) => {
        if (res.charities.length > 0) {
          setCharityId(res.charities[0]?._id || "");
        }
      })
      .catch(() => undefined);
  }, []);

  const checkout = async (plan: SubscriptionPlan) => {
    if (!user) return;
    setError("");
    setCancelMessage("");
    setProcessingPlan(plan);
    try {
      const res = await subscriptionService.checkout({
        plan,
        charityId: charityId || undefined,
        contributionPercent: 10,
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
      <p className="muted" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.8rem" }}>Membership</p>
      <h2 style={{ fontSize: "2.5rem", marginTop: "0.2rem" }}>Stripe-backed pricing</h2>
      <p className="muted">Choose your plan and start playing, winning, and giving back.</p>
      {!user && (
        <p>
          <Link to="/login">Login</Link> or <Link to="/signup">Sign up</Link> first to subscribe.
        </p>
      )}

      <div className="pricing-grid">
        <article className="card pricing-card">
          <h3>Monthly</h3>
          <p className="price">Monthly billing</p>
          <p className="muted">Billed every month</p>
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=200&fit=crop"
            alt="Golf course"
            className="pricing-img"
          />
          <button
            className="btn pricing-btn"
            disabled={!user || processingPlan !== null}
            onClick={() => checkout("monthly")}
          >
            {processingPlan === "monthly" ? "Redirecting to Stripe..." : "Choose monthly"}
          </button>
        </article>

        <article className="card pricing-card pricing-featured">
          <span className="badge">BEST VALUE</span>
          <h3>Yearly</h3>
          <p className="price">Annual billing</p>
          <p className="muted">Billed once per year</p>
          <p style={{ fontWeight: 700 }}>Save with annual billing</p>
          <img
            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=200&fit=crop"
            alt="Golf sunset"
            className="pricing-img"
          />
          <button
            className="btn ghost pricing-btn"
            disabled={!user || processingPlan !== null}
            onClick={() => checkout("yearly")}
          >
            {processingPlan === "yearly" ? "Redirecting to Stripe..." : "Choose yearly"}
          </button>
        </article>
      </div>

      {user?.subscription?.status === "active" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p className="muted">Manage your subscription</p>
          <div className="row">
            <button className="btn ghost" disabled={cancelling} onClick={() => cancelSubscription("period_end")}>
              Cancel at period end
            </button>
            <button className="btn ghost" disabled={cancelling} onClick={() => cancelSubscription("immediately")}>
              Cancel immediately
            </button>
          </div>
        </div>
      )}
      {cancelMessage && <p className="ok">{cancelMessage}</p>}
      {error && <p className="err">{error}</p>}
    </div>
  );
}
