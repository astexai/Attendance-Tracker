import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface AttendanceChartProps {
  present: number;
  absent: number;
}

export default function AttendanceChart({ present, absent }: AttendanceChartProps) {
  const total = present + absent;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  // Using HSL values from our theme
  const COLORS = ["hsl(142, 76%, 36%)", "hsl(0, 72%, 51%)"];

  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No attendance data yet
      </div>
    );
  }

  return (
    <div className="h-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-foreground text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center percentage */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: "36px" }}>
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
}