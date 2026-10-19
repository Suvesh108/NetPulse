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
      startAngle={60}
      endAngle={300}
      radius={130}
      padding={32}
      fit="content"
      transition={{ type: "spring", visualDuration: 0.5, bounce: 0.1 }}
      className={className}
    >
      <GaugeTrack
        width={12}
        color="var(--muted)"
        opacity={1}
        cap="round"
        offset={0}
      />
      <GaugeArc
        width={12}
        color={color}
        opacity={1}
        cap="round"
        offset={0}
      />
      <GaugeTicks
        count={36}
        length={5}
        width={1.2}
        color="var(--muted-foreground)"
        offset={-20}
        cap="round"
        opacity={0.45}
      />
      <GaugeValue
        x={0}
        y={-10}
        fontSize={60}
        color="var(--foreground)"
        font="rounded"
        weight="bold"
        decimals={decimals}
      />
      <GaugeText
        x={0}
        y={34}
        fontSize={16}
        color="var(--muted-foreground)"
        font="sans"
        weight="medium"
      >
        {unit}
      </GaugeText>
      <GaugeText
        x={0}
        y={78}
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
