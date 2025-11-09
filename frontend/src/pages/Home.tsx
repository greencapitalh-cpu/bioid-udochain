// Home: muestra email y accesos a Enroll / Verify
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <div className="max-w-xl w-full card p-8">
        <h1 className="text-3xl font-bold text-udo-primary mb-2">BioID</h1>
        <p className="text-udo-steel mb-6">
          Welcome <strong>{user?.email}</strong>
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <a href="/enroll" className="btn btn-primary">Enroll Biometric</a>
          <a href="/verify" className="btn btn-primary">Verify Identity</a>
        </div>

        <a href="https://wapp.udochain.com" className="link mt-6 inline-block">
          ← Back to Hub
        </a>

        <button onClick={logout} className="btn mt-4 bg-red-600 text-white">
          Logout
        </button>
      </div>
    </div>
  );
}
