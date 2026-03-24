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
      </section>
      <section className="home-features">
        <article className="feature-card feature-card--scores">
          <span className="feature-kicker">01 · Score journey</span>
          <h3>Your latest five rounds, always current</h3>
          <p>Record Stableford scores (1-45) with date played. Oldest score rotates out automatically after five.</p>
          <Link className="feature-link" to={scoreTarget}>{user ? "Open score log" : "Start scoring"}</Link>
        </article>
        <article className="feature-card feature-card--draw">
          <span className="feature-kicker">02 · Monthly draw</span>
          <h3>Prize tiers with jackpot rollover</h3>
          <p>Monthly draw workflows support random/algorithmic logic and rollover when no top-tier winner appears.</p>
          <Link className="feature-link" to={drawTarget}>{user ? "Go to dashboard" : "Unlock draws with membership"}</Link>
        </article>
        <article className="feature-card feature-card--charity">
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
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState(10);
  const [cancelMessage, setCancelMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState("");
  const [pricePayload, setPricePayload] = useState<Awaited<ReturnType<typeof subscriptionService.getPublicPrices>> | null>(null);
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

  useEffect(() => {
    setPricesLoading(true);
    setPricesError("");
    subscriptionService
      .getPublicPrices()
      .then(setPricePayload)
      .catch((err) => setPricesError((err as Error).message))
      .finally(() => setPricesLoading(false));
  }, []);

  const yearlyVsMonthlyPct =
    pricePayload?.monthly.amountCents &&
    pricePayload?.yearly.amountCents &&
    pricePayload.monthly.interval === "month" &&
    pricePayload.yearly.interval === "year"
      ? Math.max(
          0,
          Math.round((1 - pricePayload.yearly.amountCents / (12 * pricePayload.monthly.amountCents)) * 100)
        )
      : null;

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
    <div className="container pricing-page">
      <header className="pricing-header">
        <p className="hero-eyebrow">Membership</p>
        <h2>Stripe-backed pricing</h2>
        <p className="muted pricing-sub">
          Amounts below come from Stripe Price objects. Charity percentage is donation share, not the subscription amount.
        </p>
        {!user && <p className="pricing-note">Login first to continue to Stripe checkout.</p>}
      </header>
      {pricePayload?.identicalPriceIds && (
        <p className="err pricing-banner">
          `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` are set to the same value. Configure two different Stripe prices.
        </p>
      )}
      {pricesLoading && <p className="muted">Loading live prices from Stripe...</p>}
      {pricesError && <p className="err">{pricesError}</p>}
      {pricePayload && !pricesLoading && (
        <div className="pricing-grid">
          <article className="plan-card">
            <h3 className="plan-title">Monthly</h3>
            <p className="plan-price">{pricePayload.monthly.formatted}</p>
            <p className="muted plan-meta">{pricePayload.monthly.nickname || "Billed every month"}</p>
            <button
              className="btn btn-primary plan-cta"
              disabled={!user || processingPlan !== null || !charityId || loadingCharities || !!pricesError}
              onClick={() => checkout("monthly")}
            >
              {processingPlan === "monthly" ? "Redirecting..." : "Choose monthly"}
            </button>
          </article>
          <article className="plan-card plan-card--featured">
            <span className="plan-badge">Best value</span>
            <h3 className="plan-title">Yearly</h3>
            <p className="plan-price">{pricePayload.yearly.formatted}</p>
            <p className="muted plan-meta">{pricePayload.yearly.nickname || "Billed once per year"}</p>
            {yearlyVsMonthlyPct != null && yearlyVsMonthlyPct > 0 ? (
              <p className="plan-save">About {yearlyVsMonthlyPct}% less than 12x monthly</p>
            ) : null}
            <button
              className="btn btn-secondary plan-cta"
              disabled={!user || processingPlan !== null || !charityId || loadingCharities || !!pricesError}
              onClick={() => checkout("yearly")}
            >
              {processingPlan === "yearly" ? "Redirecting..." : "Choose yearly"}
            </button>
          </article>
        </div>
      )}
      <div className="card form pricing-extras">
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
        {user?.subscription?.status === "active" && (
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
