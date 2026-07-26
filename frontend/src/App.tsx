import React from 'react';
import { Header } from './components/layout/Header';
import { FacePanel } from './components/face/FacePanel';
import { FusionPanel } from './components/fusion/FusionPanel';
import { VoicePanel } from './components/voice/VoicePanel';
import { TranscriptPanel } from './components/text/TranscriptPanel';
import { ModelAgreement } from './components/dashboard/ModelAgreement';
import { TruthScoreChart } from './components/charts/TruthScoreChart';
import { ModelScoreChart } from './components/charts/ModelScoreChart';
import { TimelineHeatmap } from './components/charts/TimelineHeatmap';
import { SystemStatus } from './components/dashboard/SystemStatus';
import { useSimulationSocket } from './hooks/useSimulationSocket';
import './index.css';

const App: React.FC = () => {
  // Connect WebSocket telemetry stream
  useSimulationSocket();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main
        style={{
          flex: 1,
          padding: '10px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 0,
        }}
      >
        {/* ── TIER 1: Top Analysis Row (25% | 50% | 25%) ─────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.8fr 1fr',
            gap: 10,
            height: 440,
          }}
        >
          <FacePanel />
          <FusionPanel />
          <VoicePanel />
        </div>

        {/* ── TIER 2: Middle Analysis Row (60% | 40%) ────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 10,
            height: 310,
          }}
        >
          <TranscriptPanel />
          <ModelAgreement />
        </div>

        {/* ── TIER 3: Bottom Analytics Row (equal 4 columns) ─────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 10,
            height: 200,
          }}
        >
          <TruthScoreChart />
          <ModelScoreChart />
          <TimelineHeatmap />
          <SystemStatus />
        </div>
      </main>
    </div>
  );
};

export default App;
