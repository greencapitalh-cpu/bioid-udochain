import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";

export default function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}
