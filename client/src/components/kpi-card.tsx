import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'; // Added variant for flexibility
}

// Placeholder for variantStyles, assuming it exists elsewhere or needs to be defined.
// For this example, we'll create a basic one to make the code runnable.
const variantStyles: Record<NonNullable<KPICardProps['variant']>, { icon: string; text: string }> = {
  default: { icon: 'text-muted-foreground', text: '' },
  secondary: { icon: 'text-secondary-foreground', text: 'text-secondary-foreground' },
  destructive: { icon: 'text-destructive', text: 'text-destructive' },
  outline: { icon: 'text-primary', text: 'text-primary' },
};

export function KPICard({ title, value, icon: Icon, trend, className, variant = 'default' }: KPICardProps) {
  return (
    <Card className={cn("hover-elevate", className)} data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
        <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">{title}</CardTitle>
        <Icon className={cn("h-3 w-3 md:h-4 md:w-4 flex-shrink-0", variantStyles[variant].icon)} />
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0">
        <div className={cn("text-xl md:text-2xl font-bold", variantStyles[variant].text)} data-testid={`text-kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}% desde último periodo
          </p>
        )}
      </CardContent>
    </Card>
  );
}