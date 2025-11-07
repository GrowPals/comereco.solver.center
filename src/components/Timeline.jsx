
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  created: { icon: Clock, color: 'bg-info' },
  in_review: { icon: User, color: 'bg-warning' },
  approved: { icon: Check, color: 'bg-success' },
  rejected: { icon: X, color: 'bg-error' },
};

const TimelineItem = ({ item, isLast }) => {
  const config = statusConfig[item.status] || statusConfig.created;
  const Icon = config.icon;

  return (
    <motion.div 
      className="flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>
      <div className="pb-8">
        <p className="font-semibold capitalize">{item.status.replace('_', ' ')}</p>
        <p className="text-sm text-muted-foreground">{item.user}</p>
        <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.date), "dd MMM yyyy, hh:mm a", { locale: es })}</p>
      </div>
    </motion.div>
  );
};

const Timeline = ({ items }) => {
  return (
    <div className="p-4" role="list" aria-label="Histórico de cambios de requisición">
      {items.map((item, index) => (
        <div key={index} role="listitem" aria-label={`${item.status.replace('_', ' ')} por ${item.user} - ${format(new Date(item.date), "dd MMM yyyy", { locale: es })}`}>
          <TimelineItem item={item} isLast={index === items.length - 1} />
        </div>
      ))}
    </div>
  );
};

export default Timeline;
