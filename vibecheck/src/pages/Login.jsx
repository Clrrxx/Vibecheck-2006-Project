import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getLoginDestination } from "../data/authRedirect";
import "./Auth.css";

/**
 * Present email/password authentication, persistence selection and safe redirects.
 * @returns {import('react').ReactElement} Login page.
 */
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Authenticate with Firebase and report failures without leaving the login page.
   * @param {import('react').FormEvent<HTMLFormElement>} event Form submission.
   * @returns {Promise<void>} Completion after navigation or error-state update.
   */
  async function handleLogin(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember.checked;
    setError("");
    setIsSubmitting(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate(getLoginDestination(location.state), { replace: true });
    } catch (loginError) {
      setError(loginError.code === 'auth/too-many-requests'
        ? 'Too many login attempts. Please wait a moment and try again.'
        : loginError.code === 'auth/network-request-failed'
          ? 'We couldn’t connect. Please check your connection and try again.'
          : 'We couldn’t log you in. Please check your email and password and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Brand />
        <div className="auth-form-wrap">
          <header className="auth-heading">
            <span>Welcome back</span>
            <h1>Pick up where<br />you left off.</h1>
            <p>Log in to see your gaming profile, personalised recommendations and compatible players.</p>
          </header>

          <form className="auth-form" onSubmit={handleLogin}>
            <Field label="Email address">
              <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
            </Field>
            <Field label="Password" trailing={<a href="#forgot-password">Forgot password?</a>}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" autoComplete="current-password" required />
              <button className="show-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
            </Field>
            <label className="auth-check"><input type="checkbox" name="remember" /><span>Remember me</span></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'} <span>→</span></button>
          </form>

          <SocialButtons label="or continue with" />
          <p className="auth-switch">New to vibecheck? <Link to="/signup" state={location.state}>Create an account</Link></p>
        </div>
        <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </section>
      <AuthVisual mode="login" />
    </main>
  );
}

export function Brand() {
  return <Link className="auth-brand" to="/" aria-label="vibecheck home"><span className="auth-logo" /><span>vibecheck</span></Link>;
}

export function Field({ label, trailing, children }) {
  return <label className="field"><span className="field-label"><span>{label}</span>{trailing}</span><span className="field-input">{children}</span></label>;
}

export function SocialButtons({ label }) {
  return <><div className="auth-divider"><span>{label}</span></div><div className="social-buttons"><button type="button">G&nbsp;&nbsp; Google</button><button type="button">◉&nbsp;&nbsp; Discord</button></div></>;
}

export function AuthVisual({ mode }) {
  return (
    <section className="auth-visual" aria-label="vibecheck gamer personality preview">
      <div className="visual-glow" />
      <div className="floating-tag tag-one">OPENNESS <b>84</b></div>
      <div className="floating-tag tag-two">EXTRAVERSION <b>72</b></div>
      <div className="visual-card">
        <span className="visual-kicker">YOUR GAMER ARCHETYPE</span>
        <div className="visual-orbit"><i /><i /><i /><strong>V</strong></div>
        <h2>{mode === "signup" ? "Find your gaming vibe." : "Welcome back, Strategist."}</h2>
        <p>{mode === "signup" ? "Discover the games and people that match the way you play." : "Your next great game—and your next great teammate—are waiting."}</p>
        <div className="trait-bars">{[84, 76, 62, 70, 44].map((score) => <span key={score}><i style={{ width: `${score}%` }} /></span>)}</div>
      </div>
      <p className="visual-quote">“Games feel better when they fit who you are.”</p>
    </section>
  );
}

export default Login;
