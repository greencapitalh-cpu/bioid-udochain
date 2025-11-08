import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Enroll from "./pages/Enroll";
import Verify from "./pages/Verify";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
