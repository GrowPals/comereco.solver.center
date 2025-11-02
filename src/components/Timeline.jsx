
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  created: { icon: Clock, color: 'bg-[#3086F4]' },
  in_review: { icon: User, color: 'bg-[#FFAD3B]' },
  approved: { icon: Check, color: 'bg-[#28E888]' },
  rejected: { icon: X, color: 'bg-[#FF5A5C]' },
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
        {!isLast && <div className="w-0.5 flex-1 bg-[#E2E4E6] mt-2" />}
      </div>
      <div className="pb-8">
        <p className="font-semibold capitalize">{item.status.replace('_', ' ')}</p>
        <p className="text-sm text-[#7E8899]">{item.user}</p>
        <p className="text-xs text-[#7E8899] mt-1">{format(new Date(item.date), "dd MMM yyyy, hh:mm a", { locale: es })}</p>
      </div>
    </motion.div>
  );
};

const Timeline = ({ items }) => {
  return (
    <div className="p-4">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} isLast={index === items.length - 1} />
      ))}
    </div>
  );
};

export default Timeline;
