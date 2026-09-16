import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { ScoreRing } from '../common/ScoreRing';
import { uploadVoiceAudio } from '../../api/endpoints';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine
} from 'recharts';
import {
  Music2, CheckCircle, Upload, RotateCcw, Sparkles,
  AlertTriangle, ShieldCheck, Activity
} from 'lucide-react';

export const VoicePanel: React.FC = () => {
  const {
    voice,
    sessionState,
    sessionId,
    uploadedVoice,
    voiceFeatureHistory,
    setUploadedVoice,
    clearUploadedVoice,
  } = useSessionStore();

  const { canvasRef, connectStream, disconnect } = useAudioAnalyser(256);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeStepText, setActiveStepText] = useState<string>('');

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then(connectStream)
        .catch(() => console.warn('Microphone stream unavailable'));
    } else if (sessionState === 'Idle') {
      disconnect();
    }
    return () => {
      if (sessionState !== 'Live_Recording') disconnect();
    };
  }, [sessionState, connectStream, disconnect]);

  // Handle Audio File Upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    setActiveStepText('Decoding audio & extracting 42 acoustic features...');

    try {
      const result = await uploadVoiceAudio(file, sessionId || 'upload_session');
      setActiveStepText('Running deception classifier...');
      setTimeout(() => {
        setUploadedVoice(result);
        setIsUploading(false);
        setActiveStepText('');
      }, 300);
    } catch (err: any) {
      console.error('[Voice Upload Error]', err);
      setUploadError(err?.response?.data?.detail || 'Audio analysis failed. Please try a valid WAV/MP3.');
      setIsUploading(false);
      setActiveStepText('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Determine current active displayed voice data
  const currentVoice = voice;
  const voiceTruthScore = currentVoice ? 100 - currentVoice.deception_score : 81;
  const modelConfidence = currentVoice ? currentVoice.model_confidence : 84;
  const verdict = currentVoice?.verdict ?? 'Truthful';

  const metrics = currentVoice?.metrics ?? {
    pitch_status: 'Normal',
    speech_rate_wpm: 142,
    energy_pct: 72,
    hesitation_level: 'Low',
    pauses_count: 2,
    stability_status: 'Stable',
    jitter_pct: 0.85,
    shimmer_pct: 2.1,
  };

  const reasons = currentVoice?.key_reasons ?? [
    'Steady fundamental frequency (F0)',
    'Minimal acoustic hesitation markers',
    'Natural pause durations between syntactic clauses',
  ];

  const observations = currentVoice?.observations ?? [
    'Stable pitch variation across phrases.',
    'Consistent vocal energy profile.',
  ];

  // Colors & badges based on verdict/score
  const isDeceptive = verdict === 'Deceptive' || voiceTruthScore < 50;
  const isUncertain = verdict === 'Uncertain' || (voiceTruthScore >= 50 && voiceTruthScore < 75);
  
  const scoreColor = !isDeceptive && !isUncertain ? 'var(--accent-cyan)' : isUncertain ? 'var(--accent-amber)' : 'var(--accent-red)';
  const scoreLabel = !isDeceptive && !isUncertain ? 'High Truth' : isUncertain ? 'Moderate' : 'High Risk';

  // Feature graph data (generate default smooth timeline if idle/empty)
  const chartData = voiceFeatureHistory.length > 0
    ? voiceFeatureHistory
    : Array.from({ length: 15 }, (_, i) => ({
        timestamp: `00:${String(i * 4).padStart(2, '0')}`,
        truth: Math.round(78 + Math.sin(i * 0.4) * 6),
        hesitation: Math.round(25 + Math.cos(i * 0.5) * 8),
        energy: Math.round(70 + Math.sin(i * 0.3 + 1) * 7),
        pitchStability: Math.round(85 + Math.cos(i * 0.35) * 5),
      }));

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,.flac,.ogg,.m4a,.aac,.webm"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* ── Section Header & Controls ───────────────────────────────────── */}
      <div className="section-header" style={{ justifyContent: 'space-between', paddingRight: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Music2 size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>Voice Dynamics & Feature Graph</span>
          {sessionState === 'Live_Recording' && !uploadedVoice && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 2 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 9, color: 'var(--accent-green)', fontWeight: 700 }}>LIVE</span>
            </span>
          )}
          {uploadedVoice && (
            <span
              style={{
                fontSize: 9,
                color: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              FILE PINNED
            </span>
          )}
        </div>

        {/* Right Action Tools: Upload & Reset to Live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {uploadedVoice && (
            <button
              onClick={clearUploadedVoice}
              title="Return to Live Telemetry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={10} />
              Live
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Audio File (.wav, .mp3, .ogg)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={10} />
            Upload Audio
          </button>
        </div>
      </div>

      {/* ── Compact Waveform & Upload Zone ──────────────────────────────── */}
      <div
        style={{
          margin: '4px 8px 0',
          height: 44,
          borderRadius: 6,
          background: isDragging ? 'rgba(0, 212, 255, 0.15)' : 'rgba(0,0,0,0.4)',
          border: isDragging ? '1px dashed #00d4ff' : '1px solid rgba(30,41,59,0.6)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={44}
          style={{ width: '100%', height: '100%', display: sessionState === 'Live_Recording' ? 'block' : 'none' }}
        />

        {sessionState !== 'Live_Recording' && !isUploading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 44" preserveAspectRatio="none">
              {Array.from({ length: 70 }, (_, i) => (
                <rect
                  key={i}
                  x={i * 5.8}
                  y={22 - 3 - (i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 0)}
                  width={2.5}
                  height={6 + (i % 5 === 0 ? 10 : i % 3 === 0 ? 6 : 0)}
                  fill="rgba(0,212,255,0.18)"
                  rx={1}
                />
              ))}
            </svg>
            <span style={{ position: 'absolute', fontSize: 9.5, color: '#64748b', pointerEvents: 'none', background: 'rgba(8,12,20,0.7)', padding: '1px 6px', borderRadius: 4 }}>
              {isDragging ? 'Drop audio file here' : 'Audio input visualizer'}
            </span>
          </div>
        )}

        {isUploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,20,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={11} className="animate-spin" color="#00d4ff" />
              <span style={{ fontSize: 10.5, color: '#e2e8f0', fontWeight: 600 }}>Processing Audio...</span>
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>{activeStepText}</span>
          </div>
        )}
      </div>

      {uploadError && (
        <div style={{ margin: '3px 8px 0', padding: '3px 6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, fontSize: 9.5, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={10} color="#ef4444" />
          {uploadError}
        </div>
      )}

      {/* ── Dynamic Acoustic Feature Progression Chart ─────────────────── */}
      <div style={{ flex: 1, minHeight: 110, padding: '2px 6px 0 0', margin: '2px 4px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 2px' }}>
          <span style={{ fontSize: 8.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={9} color="#00d4ff" />
            Hesitation, Pitch & Truth Progression Over Time
          </span>
          <span style={{ fontSize: 9, color: '#00ff88', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
            {Math.round(voiceTruthScore)}% Truth
          </span>
        </div>

        <ResponsiveContainer width="100%" height={105}>
          <LineChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" />
            <XAxis dataKey="timestamp" tick={{ fill: '#475569', fontSize: 8.5 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8.5 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 6, fontSize: 10, padding: '4px 8px' }}
              labelStyle={{ color: '#94a3b8', fontSize: 9.5, marginBottom: 2 }}
              formatter={(v: any, name: any) => [`${typeof v === 'number' ? v.toFixed(0) : v}%`, name === 'truth' ? 'Truthfulness' : name === 'hesitation' ? 'Hesitation Index' : name === 'energy' ? 'Vocal Energy' : 'Pitch Stability']}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 8.5, paddingTop: 1 }}
              formatter={(value) => (
                <span style={{ color: '#64748b' }}>
                  {value === 'truth' ? 'Truth Score' : value === 'hesitation' ? 'Hesitation' : value === 'energy' ? 'Energy' : 'Stability'}
                </span>
              )}
            />
            <ReferenceLine y={70} stroke="rgba(0, 255, 136, 0.25)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="truth" stroke="#00d4ff" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#00d4ff' }} />
            <Line type="monotone" dataKey="hesitation" stroke="#f59e0b" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#f59e0b' }} />
            <Line type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={1.5} dot={false} activeDot={{ r: 2, fill: '#8b5cf6' }} />
            <Line type="monotone" dataKey="pitchStability" stroke="#00ff88" strokeWidth={1.2} strokeDasharray="3 3" dot={false} activeDot={{ r: 2, fill: '#00ff88' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── High-Density 6-Metric Telemetry Matrix ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '2px 8px 0', flexShrink: 0 }}>
        {[
          { label: 'Pitch', value: metrics.pitch_status, status: metrics.pitch_status === 'Normal' ? 'good' : 'warn' },
          { label: 'Speech Rate', value: `${Math.round(metrics.speech_rate_wpm)} wpm`, status: 'good' },
          { label: 'Energy', value: `${Math.round(metrics.energy_pct)}%`, status: 'good' },
          { label: 'Hesitation', value: metrics.hesitation_level, status: metrics.hesitation_level === 'Low' ? 'good' : 'warn' },
          { label: 'Pauses', value: `${metrics.pauses_count} pauses`, status: 'good' },
          { label: 'Stability', value: metrics.stability_status || 'Stable', status: metrics.stability_status === 'Tremor' ? 'warn' : 'good' },
        ].map(({ label, value, status }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '3px 5px',
              background: 'rgba(19, 25, 41, 0.7)',
              border: '1px solid rgba(30, 45, 71, 0.6)',
              borderRadius: 5,
            }}
          >
            <span style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {label}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: status === 'good' ? '#00d4ff' : '#f59e0b',
                marginTop: 1,
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Score Ring + Confidence & Verdict ───────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '4px 8px 0',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <ScoreRing score={voiceTruthScore} size={54} strokeWidth={4} color={scoreColor} label={scoreLabel} fontSize={11} />
          <span style={{ fontSize: 8, color: '#64748b' }}>Voice Score</span>
        </div>

        {/* Confidence & Verdict Card */}
        <div
          style={{
            flex: 1,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(30, 41, 59, 0.6)',
            borderRadius: 6,
            padding: '4px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Verdict Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Verdict</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 9.5,
                fontWeight: 700,
                color: scoreColor,
                background: `${scoreColor}15`,
                border: `1px solid ${scoreColor}40`,
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              <ShieldCheck size={9} />
              {verdict}
            </span>
          </div>

          {/* Model Confidence Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#94a3b8', marginBottom: 1 }}>
              <span>Model Confidence</span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{Math.round(modelConfidence)}%</span>
            </div>
            <div style={{ height: 3.5, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${modelConfidence}%`,
                  background: 'linear-gradient(90deg, #00d4ff 0%, #8b5cf6 100%)',
                  borderRadius: 2,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Reasons & Observations ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          margin: '4px 8px 6px',
          padding: '4px 6px',
          background: 'rgba(13, 20, 36, 0.5)',
          border: '1px solid rgba(30, 41, 59, 0.5)',
          borderRadius: 5,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
            Key Acoustic Cues & Observations
          </div>
          {reasons.slice(0, 2).map((reason, i) => (
            <div key={i} style={{ display: 'flex', gap: 3, marginBottom: 1, fontSize: 9.5, color: '#94a3b8', alignItems: 'flex-start' }}>
              <CheckCircle size={9} color="#00ff88" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{reason}</span>
            </div>
          ))}
          {observations.slice(0, 1).map((obs, i) => (
            <div key={i} style={{ fontSize: 9, color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <span style={{ color: '#00d4ff' }}>•</span>
              <span>{obs}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
