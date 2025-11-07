import React from 'react';
import { cn } from '@/lib/utils';

const baseClasses =
	'min-h-screen px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom)+1rem)] sm:px-6 sm:pt-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-16';

const PageContainer = ({ children, className, gradient = true, as = 'div', removeNavPadding = false }) => {
	const Component = as;

	return (
		<Component
			className={cn(
				baseClasses,
				removeNavPadding && 'pb-10 sm:pb-12 lg:pb-16',
				gradient ? 'page-shell' : 'page-shell-muted',
				className
			)}
		>
			{children}
		</Component>
	);
};

export default PageContainer;
