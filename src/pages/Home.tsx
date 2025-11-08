// =======================================================
// 🏠 Home.tsx — Página principal del módulo BioID
// =======================================================
import { useAuth } from "../context/AuthContext";
import Loader from "../ui/Loader";
import { Link } from "react-router-dom";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) return <Loader />;

  // 🔒 Si no hay sesión, redirige al login de UDoChain
  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold text-udo-primary mb-3">BioID Access</h1>
        <p className="text-gray-600 mb-4 text-center">
          You need to log in to access your biometric profile.
        </p>
        <a
          href="https://app.udochain.com/login"
          className="bg-udo-primary text-white rounded-lg px-4 py-2 hover:bg-udo-primary/80 transition"
        >
          Go to Login
        </a>
      </div>
    );

  // ✅ Si el usuario está logueado
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-udo-primary mb-3">BioID Module</h1>

      <p className="text-gray-600 mb-6">
        Welcome, <strong>{user.email}</strong>
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/enroll"
          className="bg-udo-primary text-white py-3 rounded-xl hover:bg-udo-primary/80 transition"
        >
          🆕 Enroll Biometric ID
        </Link>

        <Link
          to="/verify"
          className="bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition"
        >
          ✅ Verify Identity
        </Link>

        <button
          onClick={logout}
          className="bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <a
        href="https://wapp.udochain.com"
        className="text-udo-primary underline mt-6 block"
      >
        ← Return to Hub
      </a>
    </div>
  );
}
