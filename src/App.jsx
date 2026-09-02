import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';

// Cada página vira um chunk separado: visitar /coberturas não baixa o texto
// do blog nem o código do admin, por exemplo.
const Home = lazy(() => import('./pages/Home'));
const Sobre = lazy(() => import('./pages/Sobre'));
const Coberturas = lazy(() => import('./pages/Coberturas'));
const Blog = lazy(() => import('./pages/Blog'));
const Post = lazy(() => import('./pages/Post'));
const Contato = lazy(() => import('./pages/Contato'));
const NascerDoSol = lazy(() => import('./pages/NascerDoSol'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminCoberturas = lazy(() => import('./pages/admin/AdminCoberturas'));
const AdminEmBreve = lazy(() => import('./pages/admin/AdminEmBreve'));
const AdminProgresso = lazy(() => import('./pages/admin/AdminProgresso'));
const AdminRelatorios = lazy(() => import('./pages/admin/AdminRelatorios'));
const AdminCompradores = lazy(() => import('./pages/admin/AdminCompradores'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Manda um page_view pro GA4 a cada troca de rota (o site é uma SPA, então só
// o carregamento inicial dispararia pageview sozinho sem isso).
function AnalyticsTracker() {
  const location = useLocation();
  React.useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
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
        <AnalyticsTracker />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route path="coberturas" element={<AdminCoberturas />} />
              <Route path="em-breve" element={<AdminEmBreve />} />
              <Route path="progresso" element={<AdminProgresso />} />
              <Route path="relatorios" element={<AdminRelatorios />} />
              <Route path="compradores" element={<AdminCompradores />} />
              <Route path="dashboard" element={<AdminDashboard />} />
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
                    <Route path="/nascer-do-sol-na-prainha" element={<NascerDoSol />} />
                    <Route path="/:slug" element={<Post />} />
                  </Routes>
                </SiteLayout>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}
