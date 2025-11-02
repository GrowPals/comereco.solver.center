
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useRequisitions } from '@/hooks/useRequisitions';
import RequisitionCard from '@/components/RequisitionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';
import { Pagination } from '@/components/ui/pagination';


const RequisitionsPage = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, error, refetch, isFetching } = useRequisitions({ page, pageSize });

  const requisitions = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };
  
  return (
    <>
      <Helmet>
        <title>Mis Requisiciones - ComerECO</title>
        <meta name="description" content="Vea y gestione sus requisiciones de compra." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Requisiciones</h1>
            <p className="mt-1 text-muted-foreground">Aquí puedes ver el historial y estado de tus requisiciones.</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {isError && (
          <Alert variant="destructive" className="my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </motion.div>
        ) : requisitions.length > 0 ? (
          <>
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {requisitions.map((requisition) => (
                <RequisitionCard key={requisition.id} requisition={requisition} />
              ))}
            </motion.div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
              title="No tienes requisiciones"
              description="Tus requisiciones aparecerán aquí una vez que las crees desde el catálogo."
          />
        )}
      </div>
    </>
  );
};

export default RequisitionsPage;
