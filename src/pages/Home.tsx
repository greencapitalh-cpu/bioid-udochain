// =======================================================
// 🏠 Home.tsx — Página principal del módulo Validate
// =======================================================
import { useAuth } from "../context/AuthContext";
import Loader from "../ui/Loader";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) return <Loader />;
  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">Session required.</p>
        <a
          href="https://app.udochain.com/login"
          className="text-udo-primary underline"
        >
          Go to Login
        </a>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-udo-primary mb-3">
        Validate Module
      </h1>
      <p className="text-gray-600 mb-6">
        Welcome <strong>{user.email}</strong>
      </p>

      <button
        onClick={logout}
        className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600"
      >
        Logout
      </button>

      <a
        href="https://wapp.udochain.com"
        className="text-udo-primary underline mt-6 block"
      >
        ← Return to Hub
      </a>
    </div>
  );
}
