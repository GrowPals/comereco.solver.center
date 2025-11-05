import React from 'react';
import { cn } from '@/lib/utils';

const baseClasses =
	'min-h-screen px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pt-6 lg:px-8 lg:pb-16';

const PageContainer = ({ children, className, gradient = true, as = 'div' }) => {
	const Component = as;

	return (
		<Component
			className={cn(
				baseClasses,
				gradient ? 'bg-gradient-to-br from-slate-50 via-white to-slate-50' : 'bg-slate-50',
				className
			)}
		>
			{children}
		</Component>
	);
};

export default PageContainer;
