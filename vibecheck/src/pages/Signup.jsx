import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getLoginDestination } from "../data/authRedirect";
import { AuthVisual, Brand, Field } from "./Login";
import "./Auth.css";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth, database} from "../firebase";
import {ref, serverTimestamp, set} from "firebase/database";

/**
 * Create a Firebase identity and attempt owner-profile name persistence.
 * @returns {import('react').ReactElement} Registration page.
 */
function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Create an account; a failed name write does not roll back the new identity.
   * @param {import('react').FormEvent<HTMLFormElement>} event Form submission.
   * @returns {Promise<void>} Completion after navigation or visible identity error.
   */
  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;

    try {
      const firstName = form.firstName.value.trim();
      const lastName = form.lastName.value.trim();
      const { user } = await createUserWithEmailAndPassword(auth, form.email.value, form.password.value);
      if (database) {
        // Keep the names so the dashboard and Update Profile can show them. Never block signup on this.
        try {
          await set(ref(database, `users/${user.uid}/profile`), { firstName, lastName, updatedAt: serverTimestamp() });
        } catch (profileError) {
          console.warn("Could not save profile names:", profileError);
        }
      }
      navigate(getLoginDestination(location.state, "/questionnaire"), { replace: true });
    } catch (signupError) {
      console.error("Error creating user:", signupError);
      setError("We couldn't create your account. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page signup-page">
      <section className="auth-panel">
        <Brand />
        <div className="auth-form-wrap">
          <header className="auth-heading">
            <span>Create your profile</span>
            <h1>Find games that<br />match your vibe.</h1>
            <p>Join vibecheck and discover what your personality says about the way you play.</p>
          </header>
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="name-row">
              <Field label="First name"><input type="text" name="firstName" placeholder="Alex" autoComplete="given-name" required /></Field>
              <Field label="Last name"><input type="text" name="lastName" placeholder="Tan" autoComplete="family-name" required /></Field>
            </div>
            <Field label="Email address"><input type="email" name="email" placeholder="you@example.com" autoComplete="email" required /></Field>
            <Field label="Password"><input type={showPassword ? "text" : "password"} name="password" placeholder="At least 8 characters" autoComplete="new-password" minLength="8" required /><button className="show-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></Field>
            <small className="password-hint">Use 8+ characters with a number and symbol.</small>
            <label className="auth-check terms"><input type="checkbox" required /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"} <span>→</span></button>
          </form>
          {/* <SocialButtons label="or sign up with" /> */}
          <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Log in</Link></p>
        </div>
      </section>
      <AuthVisual mode="signup" />
    </main>
  );
}

export default Signup;
