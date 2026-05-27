export type TestStatus = 'idle' | 'pinging' | 'jittering' | 'downloading' | 'uploading' | 'completed';

export interface SpeedTestResult {
  id: string;
  timestamp: string; // ISO string
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  serverName: string;
}

export interface SimulationSettings {
  measureDownloadLoadedLatency: boolean;
  measureUploadLoadedLatency: boolean;
}
