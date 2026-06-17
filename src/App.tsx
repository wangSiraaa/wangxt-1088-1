import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CreatorPage from "@/pages/Creator";
import JudgePage from "@/pages/Judge";
import VolunteerPage from "@/pages/Volunteer";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/creator" element={<CreatorPage />} />
          <Route path="/judge" element={<JudgePage />} />
          <Route path="/volunteer" element={<VolunteerPage />} />
          <Route path="*" element={<div className="text-center text-xl py-20">404 - 页面不存在</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
