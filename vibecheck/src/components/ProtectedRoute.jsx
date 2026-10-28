import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import './ProtectedRoute.css';

/**
 * Observe Firebase identity and expose only authenticated, non-anonymous child routes.
 * @returns {import('react').ReactElement} Loading/error state, redirect or user-scoped outlet.
 */
export default function ProtectedRoute() {
  const [session, setSession] = useState({ loading: true, user: null, error: false });
  const location = useLocation();

  useEffect(() => onAuthStateChanged(auth,
    user => setSession({ loading: false, user, error: false }),
    () => setSession({ loading: false, user: null, error: true }),
  ), []);

  if (session.loading) return <main className="auth-gate" role="status">Checking your login…</main>;
  if (session.error) return <main className="auth-gate"><p role="alert">We couldn’t check your login. Please reload and try again.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></main>;
  if (!session.user || session.user.isAnonymous) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet key={session.user.uid} context={session.user} />;
}
