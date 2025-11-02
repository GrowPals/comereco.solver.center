
import React from 'react';
import { Helmet } from 'react-helmet';
import { useRequisitions } from '@/hooks/useRequisitions';
import RequisitionCard from '@/components/RequisitionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const RequisitionsPage = () => {
  const { requisitions, loading, error, pagination, goToPage, refetch } = useRequisitions();

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
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {error && (
          <Alert variant="destructive" className="my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence>
          {loading ? (
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
              {pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); goToPage(pagination.page - 1); }} disabled={pagination.page === 1} />
                      </PaginationItem>
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); goToPage(i + 1); }} isActive={pagination.page === i + 1}>
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); goToPage(pagination.page + 1); }} disabled={pagination.page === pagination.totalPages} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <EmptyState
                icon="FileText"
                title="No tienes requisiciones"
                description="Tus requisiciones aparecerán aquí una vez que las crees desde el catálogo."
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default RequisitionsPage;
