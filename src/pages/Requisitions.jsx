
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useRequisitions } from '@/hooks/useRequisitions';
import RequisitionCard from '@/components/RequisitionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, FileText, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';


const RequisitionsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, error, refetch, isFetching } = useRequisitions({ page, pageSize });

  const requisitions = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Helmet>
        <title>Mis Requisiciones - ComerECO</title>
        <meta name="description" content="Vea y gestione sus requisiciones de compra." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-10 pb-8 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-3">
                  Mis Requisiciones
                </h1>
                <p className="text-lg text-slate-600">
                  Historial y seguimiento de todas tus solicitudes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-12 w-12 rounded-xl hover:bg-slate-100"
                >
                  <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin text-blue-500' : 'text-slate-600'}`} />
                </Button>
                <Button
                  onClick={() => navigate('/catalog')}
                  size="lg"
                  className="shadow-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Requisición
                </Button>
              </div>
            </div>
          </header>

          {/* Error State */}
          {isError && (
            <Alert variant="destructive" className="mb-8 rounded-2xl border-2 shadow-md">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">Error al cargar requisiciones</AlertTitle>
              <AlertDescription className="text-base">{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : requisitions.length > 0 ? (
            <>
              {/* Requisitions Count */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-slate-600">
                  <span className="font-bold text-2xl text-slate-900">{totalCount}</span>
                  <span className="ml-2 text-lg">requisiciones en total</span>
                </p>
              </div>

              {/* Requisitions List */}
              <div className="space-y-6">
                {requisitions.map((requisition) => (
                  <RequisitionCard key={requisition.id} requisition={requisition} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="bg-white rounded-2xl shadow-xl p-16 max-w-lg mx-auto">
                <EmptyState
                  icon={FileText}
                  title="No tienes requisiciones"
                  description="Tus requisiciones aparecerán aquí una vez que las crees desde el catálogo."
                  action={{
                    label: 'Ir al Catálogo',
                    onClick: () => navigate('/catalog'),
                    icon: Plus
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RequisitionsPage;
