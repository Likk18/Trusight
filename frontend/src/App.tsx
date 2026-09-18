import React from 'react';
import { Header } from './components/layout/Header';
import { TopFusionChart } from './components/dashboard/TopFusionChart';
import { TopContributingFactors } from './components/dashboard/TopContributingFactors';
import { LiveCameraCard } from './components/dashboard/LiveCameraCard';
import { TruthAnalysisCard } from './components/dashboard/TruthAnalysisCard';
import { FusionScoreCard } from './components/dashboard/FusionScoreCard';
import { LiveTranscriptStrip } from './components/dashboard/LiveTranscriptStrip';
import { FacialSignalsCard } from './components/dashboard/FacialSignalsCard';
import { VocalSignalsCard } from './components/dashboard/VocalSignalsCard';
import { LinguisticSignalsCard } from './components/dashboard/LinguisticSignalsCard';
import { Footer } from './components/layout/Footer';
import { useSimulationSocket } from './hooks/useSimulationSocket';
import './index.css';

const App: React.FC = () => {
  // Connect WebSocket telemetry stream
  useSimulationSocket();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden',
        background: '#010d16',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* ── 1. TOP NAVIGATION / HEADER ───────────────────────────────── */}
      <Header />

      {/* ── MAIN DASHBOARD MATRIX (Locked Zero-Scroll Viewport) ──────── */}
      <main
        style={{
          flex: 1,
          padding: '6px 14px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── 2. TOP ANALYTICS ROW (Fusion Score 65% | Factors 35%) ────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.85fr 1fr',
            gap: 6,
            flex: '1.15 1 0',
            minHeight: 0,
          }}
        >
          <TopFusionChart />
          <TopContributingFactors />
        </div>

        {/* ── 3. MAIN ANALYSIS ROW (Camera 31% | Truth 37% | Fusion 32%) ─ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1.25fr 1.05fr',
            gap: 6,
            flex: '1.45 1 0',
            minHeight: 0,
          }}
        >
          <LiveCameraCard />
          <TruthAnalysisCard />
          <FusionScoreCard />
        </div>

        {/* ── 4. LIVE TRANSCRIPT STRIP (Full-Width 44px) ───────────────── */}
        <LiveTranscriptStrip />

        {/* ── 5. THREE SIGNAL ANALYTICS CHARTS (33.3% | 33.3% | 33.3%) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 6,
            flex: '1.1 1 0',
            minHeight: 0,
          }}
        >
          <FacialSignalsCard />
          <VocalSignalsCard />
          <LinguisticSignalsCard />
        </div>
      </main>

      {/* ── 6. BOTTOM FOOTER ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
};

export default App;
