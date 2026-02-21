'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Brain,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { ActivityMessage } from '@/types/research';

interface ActivityItemProps {
  activity: ActivityMessage;
  isLatest?: boolean;
}

export function ActivityItem({ activity, isLatest = false }: ActivityItemProps) {
  const { icon: Icon, color, bgColor } = useMemo(() => {
    switch (activity.type) {
      case 'searching':
        return {
          icon: Search,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        };
      case 'reading':
        return {
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        };
      case 'found':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
        };
      case 'thinking':
        return {
          icon: Brain,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        };
      case 'analyzing':
        return {
          icon: FileText,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
        };
      case 'result':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        };
    }
  }, [activity.type]);

  const formattedTime = useMemo(() => {
    const date = new Date(activity.timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [activity.timestamp]);

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg transition-all duration-300',
        bgColor,
        isLatest && 'ring-2 ring-primary/20 shadow-sm'
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        {isLatest && activity.type !== 'found' && activity.type !== 'error' ? (
          <Loader2 className={cn('h-5 w-5 animate-spin', color)} />
        ) : (
          <Icon className={cn('h-5 w-5', color)} />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {activity.message}
        </p>

        {/* Metadata */}
        {activity.metadata && (
          <div className="space-y-1">
            {activity.metadata.source && (
              <p className="text-xs text-muted-foreground">
                Source: {activity.metadata.source}
              </p>
            )}
            {activity.metadata.count !== undefined && (
              <p className="text-xs text-muted-foreground">
                Found {activity.metadata.count} item{activity.metadata.count !== 1 ? 's' : ''}
              </p>
            )}
            {activity.metadata.articleTitle && (
              <p className="text-xs text-muted-foreground italic">
                &quot;{activity.metadata.articleTitle}&quot;
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground/70">{formattedTime}</p>
      </div>
    </div>
  );
}
