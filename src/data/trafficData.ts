export type TrafficChartRange = "live" | "1h" | "6h" | "24h" | "7d";

export interface TrafficPoint {
  t: string;
  in: number;
  out: number;
  packets?: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateLiveTraffic(seed = 42): TrafficPoint[] {
  const rand = seededRandom(seed);
  return Array.from({ length: 20 }, (_, i) => ({
    t: `${i * 3}s`,
    in: Math.floor(rand() * 400 + 200),
    out: Math.floor(rand() * 300 + 150),
    packets: Math.floor(rand() * 5000 + 2000),
  }));
}

export const trafficDataMap: Record<Exclude<TrafficChartRange, "live">, TrafficPoint[]> = {
  "1h": [
    { t: "00m", in: 88, out: 62 },
    { t: "10m", in: 95, out: 71 },
    { t: "20m", in: 142, out: 96 },
    { t: "30m", in: 118, out: 78 },
    { t: "40m", in: 133, out: 90 },
    { t: "50m", in: 156, out: 108 },
    { t: "60m", in: 129, out: 84 },
  ],
  "6h": [
    { t: "09:00", in: 55, out: 35 },
    { t: "10:00", in: 89, out: 62 },
    { t: "11:00", in: 124, out: 88 },
    { t: "12:00", in: 142, out: 96 },
    { t: "13:00", in: 138, out: 91 },
    { t: "14:00", in: 155, out: 108 },
  ],
  "24h": [
    { t: "00:00", in: 42, out: 28 },
    { t: "04:00", in: 31, out: 18 },
    { t: "08:00", in: 89, out: 62 },
    { t: "12:00", in: 142, out: 96 },
    { t: "16:00", in: 155, out: 108 },
    { t: "20:00", in: 98, out: 64 },
  ],
  "7d": [
    { t: "Mon", in: 980, out: 720 },
    { t: "Tue", in: 1240, out: 910 },
    { t: "Wed", in: 890, out: 640 },
    { t: "Thu", in: 1560, out: 1120 },
    { t: "Fri", in: 1380, out: 980 },
    { t: "Sat", in: 620, out: 440 },
    { t: "Sun", in: 710, out: 520 },
  ],
};

export function getTrafficData(range: TrafficChartRange, liveSeed?: number): TrafficPoint[] {
  if (range === "live") return generateLiveTraffic(liveSeed ?? Date.now() % 10000);
  return trafficDataMap[range];
}

export const KPI_BY_RANGE: Record<TrafficChartRange, { inbound: string; outbound: string; packets: string; anomalies: string }> = {
  live: { inbound: "2.4 Gbps", outbound: "1.8 Gbps", packets: "847K", anomalies: "23" },
  "1h": { inbound: "156 Mbps", outbound: "108 Mbps", packets: "124K", anomalies: "18" },
  "6h": { inbound: "892 Mbps", outbound: "640 Mbps", packets: "512K", anomalies: "47" },
  "24h": { inbound: "1.8 Gbps", outbound: "1.2 Gbps", packets: "2.1M", anomalies: "89" },
  "7d": { inbound: "8.4 Tbps", outbound: "5.9 Tbps", packets: "14.2M", anomalies: "331" },
};
