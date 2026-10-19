import {
  Gauge,
  GaugeArc,
  GaugeText,
  GaugeTicks,
  GaugeTrack,
  GaugeValue,
} from "@/components/gauge"

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
  max = Math.max(1000, Math.ceil(value / 250) * 250),
  unit = "Mbps",
  label = "Download",
  color = "var(--primary)",
  decimals = 0,
  className,
}: CustomGaugeProps) {
  return (
    <Gauge
      value={value}
      min={0}
      max={max}
      startAngle={90}
      endAngle={270}
      radius={180}
      padding={30}
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
    </Gauge>
  )
}

export default CustomGauge
