package com.netpulse.speedtest.model

enum class TestStatus {
    IDLE,
    PINGING,
    JITTERING,
    DOWNLOADING,
    UPLOADING,
    COMPLETED
}

enum class EngineBackend(val idName: String, val displayName: String, val pops: String, val badge: String) {
    CLOUDFLARE("cloudflare", "Cloudflare Global Edge CDN", "330+ Global PoPs", "Recommended"),
    FASTLY("fastly", "Fastly High-Capacity Edge", "180+ Core PoPs", "High Throughput"),
    CLOUDFRONT("cloudfront", "AWS CloudFront Global Backbone", "600+ Edge Locations", "Enterprise"),
    GCP("gcp", "Google Cloud CDN (Premium Tier)", "200+ Edge Locations", "Low Jitter"),
    AKAMAI("akamai", "Akamai Connected Edge Network", "4000+ Distributed Locations", "Maximum Reach"),
    CUSTOM("custom", "Custom / Self-Hosted Speed Node", "User Defined", "Developer")
}

enum class RoutingProtocol(val idName: String, val displayName: String, val speedTag: String, val icon: String) {
    ANYCAST_BGP("anycast-bgp", "Anycast BGP Smart Routing", "Optimal Latency", "🌐"),
    HTTP3_QUIC("http3-quic", "HTTP/3 over QUIC (UDP 0-RTT)", "Fastest Handshake", "⚡"),
    HTTP2_TCP("http2-tcp", "HTTP/2 Multiplexed (TCP TLS 1.3)", "Broad Support", "🔒"),
    GEODNS_UNICAST("geodns-unicast", "GeoDNS Direct Unicast Routing", "Predictable Path", "📍"),
    MULTIPATH_ADAPTIVE("multipath-adaptive", "Multi-Path Adaptive Fallback", "Max Reliability", "🔀")
}

data class SpeedTestResult(
    val id: String,
    val timestamp: String,
    val downloadMbps: Double,
    val uploadMbps: Double,
    val pingMs: Int,
    val jitterMs: Double,
    val serverName: String = "Cloudflare Global Anycast Edge",
    val routingProtocol: String = "anycast-bgp",
    val bufferbloatGrade: String = "A+",
    val loadedLatencyMs: Int = 4,
    val downloadLoadedLatencyMs: Int? = null,
    val uploadLoadedLatencyMs: Int? = null,
    val connectionMode: String = "multi",
    val packetLoss: Double = 0.0,
    val voipMos: Double = 4.35,
    val date: String = ""
)

data class SimulationSettings(
    val measureDownloadLoadedLatency: Boolean = true,
    val measureUploadLoadedLatency: Boolean = true,
    val engineBackend: EngineBackend = EngineBackend.CLOUDFLARE,
    val routingProtocol: RoutingProtocol = RoutingProtocol.ANYCAST_BGP,
    val customServerUrl: String = "",
    val packetProbesCount: Int = 25,
    val selectedRegion: String = "Auto (Nearest Edge PoP)",
    val connectionMode: String = "multi",
    val autoScheduled: Boolean = false,
    val scheduledIntervalHours: Int = 6,
    val scheduledThresholdMbps: Int = 50
)

data class ProbeRecord(
    val id: Int,
    val ok: Boolean,
    val rtt: Int
)

data class MtrTarget(
    val id: String,
    val name: String,
    val ip: String,
    val url: String,
    val colorHex: Long,
    val history: List<Int> = emptyList(),
    val sent: Int = 0,
    val lost: Int = 0,
    val min: Int? = null,
    val max: Int? = null,
    val avg: Int? = null,
    val jitter: Double? = null,
    val current: Int? = null
)

data class IceCandidateInfo(
    val type: String,
    val protocol: String,
    val address: String,
    val port: Int,
    val serverUrl: String = "STUN"
)

enum class NatClassification {
    OPEN_FULL_CONE,
    MODERATE_RESTRICTED,
    STRICT_SYMMETRIC,
    DIRECT_PUBLIC,
    UNDETECTED
}

data class MtuBoundary(
    val size: Int,
    val label: String,
    val useCase: String,
    val overheadPct: Double,
    val status: String = "idle", // idle, testing, pass, fragmented
    val rttMs: Int? = null
)

data class DnsResolver(
    val id: String,
    val name: String,
    val primaryIp: String,
    val dohEndpoint: String,
    val provider: String,
    val description: String,
    val latencyMs: Int? = null,
    val status: String = "idle", // idle, testing, success, failed
    val ipResolved: String? = null,
    val dnssec: Boolean = false
)

data class ProtocolResult(
    val supported: Boolean? = null,
    val latencyMs: Int? = null,
    val ipAddress: String? = null,
    val status: String = "idle" // idle, testing, success, unsupported
)

data class TraceData(
    val clientIp: String,
    val colo: String,
    val loc: String,
    val tls: String,
    val http: String,
    val asn: String,
    val org: String,
    val city: String,
    val latencyMs: Int
)
