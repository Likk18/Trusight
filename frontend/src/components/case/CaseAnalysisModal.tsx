import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { uploadCaseReport, analyzeCaseStatement, checkOllamaStatus } from '../../api/endpoints';
import type { CaseAnalysisResult } from '../../types';
import {
  FileText,
  Upload,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface CaseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaseAnalysisModal: React.FC<CaseAnalysisModalProps> = ({ isOpen, onClose }) => {
  const {
    activeCase,
    setActiveCase,
    caseAnalysis,
    setCaseAnalysis,
    isRecordingInterview,
    setIsRecordingInterview,
  } = useSessionStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual statement analysis
  const [statementInput, setStatementInput] = useState('');
  const [analyzingStatement, setAnalyzingStatement] = useState(false);

  // Ollama status
  const [ollamaInfo, setOllamaInfo] = useState<{ available: boolean; has_model: boolean } | null>(null);

  // Audio recording WebSocket refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentTimerRef = useRef<number | null>(null);

  // Check Ollama on open
  useEffect(() => {
    if (isOpen) {
      checkOllamaStatus()
        .then((info) => setOllamaInfo(info))
        .catch(() => setOllamaInfo({ available: false, has_model: false }));
    }
  }, [isOpen]);

  // Stop live interview recording and clean up resources
  const stopInterviewRecording = () => {
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsRecordingInterview(false);
  };

  // Clean up recording on unmount or close
  useEffect(() => {
    return () => {
      stopInterviewRecording();
    };
  }, []);

  if (!isOpen) return null;

  // Handle PDF file selection & upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const res = await uploadCaseReport(selectedFile);
      setActiveCase({
        case_id: res.case_id,
        filename: res.filename,
        pages: res.pages,
        chunks: res.chunks,
      });
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || err.message || 'Failed to upload and index PDF.');
    } finally {
      setUploading(false);
    }
  };

  // Handle direct text statement verification
  const handleVerifyStatement = async () => {
    if (!activeCase || !statementInput.trim()) return;
    setAnalyzingStatement(true);
    try {
      const res = await analyzeCaseStatement(activeCase.case_id, statementInput.trim());
      setCaseAnalysis(res as CaseAnalysisResult);
    } catch (err: any) {
      console.error('Statement verification failed:', err);
    } finally {
      setAnalyzingStatement(false);
    }
  };

  // Start live interview audio streaming over WebSocket
  const startInterviewRecording = async () => {
    if (!activeCase) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/audio/${activeCase.case_id}`;

      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        setIsRecordingInterview(true);
        recordSegment();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'success' && data.transcript) {
            setCaseAnalysis(data as CaseAnalysisResult);
          }
        } catch {
          // ignore parsing error
        }
      };

      socket.onerror = (e) => {
        console.error('Audio WS error:', e);
      };

      socket.onclose = () => {
        setIsRecordingInterview(false);
      };
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  // Segmented recording loop (~5s chunks)
  const recordSegment = () => {
    const stream = mediaStreamRef.current;
    if (!stream || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size > 0 && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const buffer = await blob.arrayBuffer();
        socketRef.current.send(buffer);
      }
      if (mediaStreamRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        recordSegment();
      }
    };

    recorder.start();
    segmentTimerRef.current = window.setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 5000);
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'Entailment':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', icon: <CheckCircle size={14} /> };
      case 'Contradiction':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', icon: <AlertTriangle size={14} /> };
      default:
        return { color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.15)', border: 'rgba(0, 212, 255, 0.4)', icon: <HelpCircle size={14} /> };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 8, 16, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#01121f',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: 12,
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 212, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
            background: 'rgba(0, 20, 36, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} color="#00d4ff" />
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                Case Evidence & Interview Analysis
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>
                PDF Chunking • FAISS Retrieval • DeBERTa NLI • Local Ollama Grounding
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Ollama Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: ollamaInfo?.available ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${ollamaInfo?.available ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                color: ollamaInfo?.available ? '#10b981' : '#f87171',
                fontFamily: 'Space Grotesk',
              }}
            >
              <Sparkles size={11} />
              <span>Ollama (llama3.2:3b): {ollamaInfo?.available ? 'Ready' : 'Offline (Fallback Active)'}</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Section 1: Case PDF Management */}
          <div
            style={{
              background: '#00192a',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              1. Case Report Document
            </div>

            {!activeCase ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    color: '#94a3b8',
                    fontSize: 12,
                    background: '#00111d',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                  }}
                />
                <button
                  disabled={!selectedFile || uploading}
                  onClick={handleFileUpload}
                  style={{
                    background: uploading ? '#1e293b' : '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Upload size={13} />
                  {uploading ? 'Extracting & Indexing...' : 'Load Case PDF'}
                </button>
                {uploadError && (
                  <span style={{ color: '#ef4444', fontSize: 11 }}>{uploadError}</span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f8fafc' }}>
                    {activeCase.filename}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    ({activeCase.pages} pages, {activeCase.chunks} chunks indexed)
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#00d4ff',
                      background: 'rgba(0, 212, 255, 0.1)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    ID: {activeCase.case_id.slice(0, 8)}...
                  </span>
                </div>

                <button
                  onClick={() => {
                    stopInterviewRecording();
                    setActiveCase(null);
                    setCaseAnalysis(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Change Case
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Live Interview Stream or Statement Test */}
          {activeCase && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 14,
              }}
            >
              {/* Live Audio Streaming */}
              <div
                style={{
                  background: '#00192a',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', fontFamily: 'Space Grotesk' }}>
                  2. Live Audio Interview
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  Streams live microphone segments (5s intervals) to Whisper STT, retrieves matching evidence, and computes NLI classification.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!isRecordingInterview ? (
                    <button
                      onClick={startInterviewRecording}
                      style={{
                        background: '#15803d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Mic size={14} />
                      Start Audio Stream
                    </button>
                  ) : (
                    <button
                      onClick={stopInterviewRecording}
                      style={{
                        background: '#b91c1c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MicOff size={14} />
                      Stop Audio Stream
                    </button>
                  )}

                  {isRecordingInterview && (
                    <span style={{ fontSize: 11, color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', animation: 'pulse-dot 1s infinite' }} />
                      Listening & Analyzing...
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Statement Test */}
              <div
                style={{
                  background: '#00192a',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', fontFamily: 'Space Grotesk' }}>
                  3. Test Statement
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={statementInput}
                    onChange={(e) => setStatementInput(e.target.value)}
                    placeholder="Enter statement to verify against case..."
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyStatement()}
                    style={{
                      flex: 1,
                      background: '#00111d',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: '#f8fafc',
                      fontSize: 12,
                    }}
                  />
                  <button
                    disabled={!statementInput.trim() || analyzingStatement}
                    onClick={handleVerifyStatement}
                    style={{
                      background: analyzingStatement ? '#1e293b' : '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: statementInput.trim() && !analyzingStatement ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {analyzingStatement ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Live Verification Results */}
          {caseAnalysis && (
            <div
              style={{
                background: '#001524',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Verdict Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Statement Under Verification:</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
                    &ldquo;{caseAnalysis.transcript}&rdquo;
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Verdict Badge */}
                  {(() => {
                    const st = getVerdictStyle(caseAnalysis.verdict);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: st.bg,
                          border: `1px solid ${st.border}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          color: st.color,
                          fontWeight: 800,
                          fontSize: 13,
                          fontFamily: 'Space Grotesk',
                        }}
                      >
                        {st.icon}
                        <span>{caseAnalysis.verdict}</span>
                      </div>
                    );
                  })()}

                  <div
                    style={{
                      background: 'rgba(0, 20, 34, 0.8)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#00d4ff',
                      fontFamily: 'Space Grotesk',
                    }}
                  >
                    Confidence: {caseAnalysis.confidence}%
                  </div>
                </div>
              </div>

              {/* Explanation Summary */}
              {caseAnalysis.explanation && (
                <div
                  style={{
                    background: '#001a2e',
                    border: '1px solid rgba(0, 212, 255, 0.15)',
                    borderRadius: 6,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>
                    Ollama Evidence Synthesis:
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                    {caseAnalysis.explanation.summary}
                  </div>

                  {/* Conflicting Elements Table */}
                  {caseAnalysis.explanation.conflicting_elements && caseAnalysis.explanation.conflicting_elements.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
                        Detected Factual Discrepancies:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {caseAnalysis.explanation.conflicting_elements.map((conf, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: 4,
                              padding: '5px 8px',
                              fontSize: 11,
                              display: 'flex',
                              gap: 10,
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>
                              [{conf.type}]
                            </span>
                            <span style={{ color: '#e2e8f0' }}>Interview: <b>{conf.interview}</b></span>
                            <span style={{ color: '#64748b' }}>vs</span>
                            <span style={{ color: '#00d4ff' }}>Evidence: <b>{conf.evidence}</b> (Page {conf.page || 1})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Retrieved Evidence Excerpts */}
              {caseAnalysis.evidence && caseAnalysis.evidence.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={12} />
                    <span>Retrieved Case Evidence ({caseAnalysis.evidence.length} chunks):</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {caseAnalysis.evidence.map((chunk, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#00111d',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 11.5,
                          lineHeight: 1.45,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ color: '#8b5cf6', fontWeight: 700 }}>
                            Chunk {idx + 1} • Page {chunk.page}
                          </span>
                          <span style={{ color: '#64748b', fontSize: 10 }}>
                            L2 Distance: {chunk.distance}
                          </span>
                        </div>
                        <div style={{ color: '#cbd5e1' }}>{chunk.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
