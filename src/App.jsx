import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Sobre from './pages/Sobre';
import Coberturas from './pages/Coberturas';
import Blog from './pages/Blog';
import Post from './pages/Post';
import Contato from './pages/Contato';
import AdminLayout from './pages/admin/AdminLayout';
import AdminCoberturas from './pages/admin/AdminCoberturas';
import AdminEmBreve from './pages/admin/AdminEmBreve';
import AdminProgresso from './pages/admin/AdminProgresso';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteLayout({ children }) {
  return (
    <div className="min-h-screen font-sans text-slate-800 bg-white flex flex-col selection:bg-red-200">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="coberturas" element={<AdminCoberturas />} />
            <Route path="em-breve" element={<AdminEmBreve />} />
            <Route path="progresso" element={<AdminProgresso />} />
            <Route index element={<AdminCoberturas />} />
          </Route>

          <Route
            path="*"
            element={
              <SiteLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/sobre" element={<Sobre />} />
                  <Route path="/coberturas" element={<Coberturas />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="/:slug" element={<Post />} />
                </Routes>
              </SiteLayout>
            }
          />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}
