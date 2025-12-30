import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StageData {
  stageId: string;
  stageName: string;
  count: number;
  value: number;
  color: string;
}

interface CrmFunnelChartProps {
  data: StageData[];
}

export function CrmFunnelChart({ data }: CrmFunnelChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        Configure os estágios do CRM para ver o funil
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
          />
          <YAxis 
            type="category"
            dataKey="stageName"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(224 71% 7%)',
              border: '1px solid hsl(215 28% 17%)',
              borderRadius: '8px',
              color: 'hsl(213 31% 91%)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} empresas`,
              props.payload.stageName
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || 'hsl(250 89% 62%)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
