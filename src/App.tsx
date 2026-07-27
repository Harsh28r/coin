import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import './styles/animations.css';

// Infra / providers / always-mounted UI — kept eager (tiny, needed on every route)
import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { WatchlistProvider } from './context/WatchlistContext';
import DefaultSEO from './Components/DefaultSEO';
import AdminGate from './Components/AdminGate';
import BackToTop from './Components/BackToTop';
import ScrollProgress from './Components/ScrollProgress';
import { Analytics } from '@vercel/analytics/react';
import useAdSenseControl from './Components/AdSenseControl';
import FloatingAIChat from './Components/FloatingAIChat';
import NewsletterModal from './Components/NewsletterModal';

// Route components — lazy loaded so each page ships in its own chunk
const LandingPage = lazy(() => import('./pages/Landing'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AllNews = lazy(() => import('./Components/Exnews'));
const PresNews = lazy(() => import('./Components/PressNews'));
const Exn = lazy(() => import('./Components/Exn'));
const Advertise = lazy(() => import('./Components/advertise'));
const Trend = lazy(() => import('./Components/Trend'));
const MainDashboard = lazy(() => import('./pages/MainAdminDash'));
const Watchlist = lazy(() => import('./Components/Watchlist'));
const SearchPage = lazy(() => import('./Components/SearchPage'));
const NewsDetail = lazy(() => import('./Components/NewsDetail'));
const BlogHome = lazy(() => import('./Components/BlogHome'));
const BlogPostDetail = lazy(() => import('./Components/BlogPostDetail'));
const Learn = lazy(() => import('./Components/Learn'));
const InDepthNewsPage = lazy(() => import('./pages/InDepthNewsPage'));
const EventRadar = lazy(() => import('./Components/EventRadar'));
const Listing = lazy(() => import('./Components/Listings'));
const CoinDetail = lazy(() => import('./Components/CoinDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AllAINews = lazy(() => import('./pages/AllAINews'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const ArbitrageChecker = lazy(() => import('./Components/ArbitrageChecker'));
const CryptoTools = lazy(() => import('./Components/CryptoTools'));
const ArbitrageDashboard = lazy(() => import('./pages/ArbitrageDashboard'));
const AirdropDetail = lazy(() => import('./pages/AirdropDetail'));
const FearGreedPage = lazy(() => import('./pages/tools/FearGreed'));
const GasTrackerPage = lazy(() => import('./pages/tools/GasTracker'));
const ScamCheckPage = lazy(() => import('./pages/tools/ScamCheck'));
const CompareCoinsPage = lazy(() => import('./pages/tools/CompareCoins'));
const TokenUnlocksPage = lazy(() => import('./pages/tools/TokenUnlocks'));
const DailyDigestArchive = lazy(() => import('./pages/DailyDigest'));
const TrendingDeskArchive = lazy(() => import('./pages/TrendingDesk'));
const AiAgentsArchive = lazy(() => import('./pages/AiAgents'));
const PredictionsHub = lazy(() => import('./pages/Predictions'));
const PredictionDetail = lazy(() => import('./pages/PredictionDetail'));
const LiveHub = lazy(() => import('./pages/Live'));
const LiveDetail = lazy(() => import('./pages/LiveDetail'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const AuthorIndex = lazy(() =>
  import('./pages/AuthorPage').then((m) => ({ default: m.AuthorIndex }))
);
const CoinpediaPartnerPage = lazy(() => import('./pages/CoinpediaPartnerPage'));
const CoinNewsHub = lazy(() => import('./pages/CoinNewsHub'));
const WhyCoinToday = lazy(() => import('./pages/WhyCoinToday'));
const EventKindHub = lazy(() => import('./pages/EventKindHub'));


const ScrollToTop: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
};

// AdSense control - disable ads on aggregated content pages
const AdSenseController: React.FC = () => {
  useAdSenseControl();
  return null;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BlogProvider>
          <CurrencyProvider>
            <WatchlistProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <AdSenseController />
              <ScrollProgress />
              <div className="App">
                <DefaultSEO />
                <Analytics />
                <BackToTop />
                <FloatingAIChat />
                <NewsletterModal />
                <Suspense fallback={<div className="route-loading" style={{ minHeight: '60vh' }} />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/daily-digest" element={<DailyDigestArchive />} />
                  <Route path="/trending-desk" element={<TrendingDeskArchive />} />
                  <Route path="/ai-agents" element={<AiAgentsArchive />} />
                  <Route path="/predictions" element={<PredictionsHub />} />
                  <Route path="/prediction/:coinId" element={<PredictionDetail />} />
                  <Route path="/live" element={<LiveHub />} />
                  <Route path="/live/:slug" element={<LiveDetail />} />
                  <Route path="/authors" element={<AuthorIndex />} />
                  <Route path="/author/:slug" element={<AuthorPage />} />
                  <Route path="/partners/coinpedia" element={<CoinpediaPartnerPage />} />
                  <Route path="/blog/:id" element={<BlogPostDetail />} />
                  <Route path="/blog" element={<BlogHome />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/login" element={<LoginPage />} />
                  {/* <Route path="/admin" element={<AdminGate><   MainDashboard/></AdminGate>} /> */}
                  <Route path="/All-exclusive-news" element={<AllNews />} /> 
                  <Route path="/press-news" element={<PresNews />} /> 
                  <Route path="/exclusive-news" element={< Exn/ >} /> 
                  <Route path="/advertise" element={<  Advertise />} /> 
                  <Route path="/All-Trending-news" element={<  Trend />} /> 
                  <Route path="/beyond-the-headlines" element={<InDepthNewsPage />} />
                  <Route path="/listings" element={<Listing />} />
                  <Route path="/events/:kind" element={<EventKindHub />} />
                  <Route path="/events" element={<EventRadar />} />
                  <Route path="/ai-news" element={<AllAINews />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  <Route path="/coin/:coinId/news" element={<CoinNewsHub />} />
                  <Route path="/today/why-is-:coinId-up" element={<WhyCoinToday />} />
                  <Route path="/today/why-is-:coinId-down" element={<WhyCoinToday />} />
                  <Route path="/coin/:coinId" element={<CoinDetail />} />
                  <Route path="/main-dashboard" element={<AdminGate><   MainDashboard/></AdminGate>} /> 
                  {/* <Route path="/press-release-detail" element={<PressReleaseDetail />} /> */}
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/arbitrage" element={<ArbitrageChecker />} />
                  <Route path="/arbitrage-scanner" element={<ArbitrageDashboard />} />
                  <Route path="/airdrop/:id" element={<AirdropDetail />} />
                  <Route path="/tools" element={<CryptoTools />} />
                  <Route path="/tools/fear-greed" element={<FearGreedPage />} />
                  <Route path="/tools/gas" element={<GasTrackerPage />} />
                  <Route path="/tools/scam-check" element={<ScamCheckPage />} />
                  <Route path="/tools/unlocks" element={<TokenUnlocksPage />} />
                  <Route path="/compare" element={<CompareCoinsPage />} />
                  <Route path="/compare/:slug" element={<CompareCoinsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </div>
            </Router>
            </WatchlistProvider>
          </CurrencyProvider>
        </BlogProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

