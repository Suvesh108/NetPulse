import {
  Gauge,
  GaugeArc,
  GaugeText,
  GaugeTicks,
  GaugeTrack,
  GaugeValue,
} from "@/components/gauge"

export function computeDynamicGaugeMax(val: number, unit: string = "Mbps"): number {
  if (unit === "MB/s") {
    if (val <= 0) return 20;
    if (val <= 1.2) return 2;
    if (val <= 3) return 5;
    if (val <= 6) return 10;
    if (val <= 14) return 20;
    if (val <= 35) return 50;
    if (val <= 75) return 100;
    if (val <= 160) return 250;
    return Math.ceil(val / 50) * 50;
  }

  // Default: Mbps
  if (val <= 0) return 100;
  if (val <= 6) return 10;
  if (val <= 14) return 20;
  if (val <= 28) return 40;
  if (val <= 55) return 75;
  if (val <= 85) return 100;
  if (val <= 170) return 200;
  if (val <= 300) return 400;
  if (val <= 500) return 600;
  if (val <= 850) return 1000;
  if (val <= 1700) return 2000;
  return Math.ceil(val / 500) * 500;
}

export interface CustomGaugeProps {
  value: number
  max?: number
  unit?: string
  label?: string
  color?: string
  decimals?: number
  className?: string
}

export function CustomGauge({
  value,
  max,
  unit = "Mbps",
  label = "Download",
  color = "var(--primary)",
  decimals = 0,
  className,
}: CustomGaugeProps) {
  const resolvedMax = max ?? computeDynamicGaugeMax(value, unit);

  return (
    <Gauge
      value={value}
      min={0}
      max={resolvedMax}
      startAngle={90}
      endAngle={270}
      radius={180}
      padding={32}
      fit="content"
      transition={{ type: "spring", visualDuration: 0.5, bounce: 0.1 }}
      className={className}
    >
      <GaugeTrack
        width={16}
        color="var(--muted)"
        opacity={1}
        cap="round"
        offset={0}
      />
      <GaugeArc
        width={16}
        color={color}
        opacity={1}
        cap="round"
        offset={0}
      />
      <GaugeTicks
        count={37}
        length={7}
        width={1.6}
        color="var(--muted-foreground)"
        offset={-18}
        cap="round"
        opacity={0.45}
      />
      <GaugeValue
        x={0}
        y={-50}
        fontSize={78}
        color="var(--foreground)"
        font="rounded"
        weight="bold"
        decimals={decimals}
      />
      <GaugeText
        x={0}
        y={-8}
        fontSize={18}
        color="var(--muted-foreground)"
        font="sans"
        weight="medium"
      >
        {unit}
      </GaugeText>
      <GaugeText
        x={0}
        y={24}
        fontSize={15}
        color="var(--muted-foreground)"
        font="sans"
        weight="semibold"
      >
        {label}
      </GaugeText>
      <GaugeText
        x={-165}
        y={20}
        fontSize={12}
        color="var(--muted-foreground)"
        font="mono"
        weight="medium"
        anchor="middle"
      >
        0
      </GaugeText>
      <GaugeText
        x={165}
        y={20}
        fontSize={12}
        color="var(--muted-foreground)"
        font="mono"
        weight="medium"
        anchor="middle"
      >
        {resolvedMax}
      </GaugeText>
    </Gauge>
  )
}

export default CustomGauge
