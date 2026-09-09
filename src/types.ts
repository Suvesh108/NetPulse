export type TestStatus = 'idle' | 'pinging' | 'jittering' | 'downloading' | 'uploading' | 'completed';

export type EngineBackend = 'cloudflare' | 'fastly' | 'cloudfront' | 'gcp' | 'akamai' | 'custom';

export type RoutingProtocol = 'anycast-bgp' | 'http3-quic' | 'http2-tcp' | 'geodns-unicast' | 'multipath-adaptive';

export interface SpeedTestResult {
  id: string;
  timestamp: string; // ISO string
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  serverName: string;
  routingProtocol?: string;
  
  // v0.9 Extended Telemetry
  downloadSpeed?: number;
  uploadSpeed?: number;
  ping?: number;
  jitter?: number;
  date?: string;
  bufferbloatGrade?: string;
  loadedLatencyMs?: number;
  packetLoss?: number;
  voipMos?: number;
  streamingQuality?: string;
  gamingQuality?: string;
  chatQuality?: string;
}

export interface SimulationSettings {
  measureDownloadLoadedLatency: boolean;
  measureUploadLoadedLatency: boolean;
  engineBackend: EngineBackend;
  routingProtocol: RoutingProtocol;
  customServerUrl?: string;
  packetProbesCount?: number;
  selectedRegion?: string;
}
