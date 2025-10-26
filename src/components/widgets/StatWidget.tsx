import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface StatWidgetProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
  onNavigate?: () => void;
  className?: string;
}

export function StatWidget({ icon: Icon, title, value, description, onNavigate, className }: StatWidgetProps) {
  const isClickable = !!onNavigate;
  return (
    <Card
      className={cn('h-full transition-all', isClickable && 'cursor-pointer hover:bg-muted/50', className)}
      onClick={onNavigate}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
