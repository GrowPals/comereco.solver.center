
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useRequisitions } from '@/hooks/useRequisitions';
import { useQuery } from '@tanstack/react-query';
import { getMyProjects } from '@/services/projectService';
import RequisitionCard from '@/components/RequisitionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, FileText, RefreshCw, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';


const RequisitionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(location.state?.projectId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const pageSize = 10;

  const { data: projects } = useQuery({ queryKey: ['myProjects'], queryFn: getMyProjects });
  const { data, isLoading, isError, error, refetch, isFetching } = useRequisitions({ page, pageSize });

  // Filtrar requisiciones por proyecto y estado en el cliente
  const filteredRequisitions = useMemo(() => {
    let filtered = data?.data ?? [];
    
    if (selectedProject && selectedProject !== 'all') {
      filtered = filtered.filter(req => req.project_id === selectedProject);
    }
    
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(req => req.business_status === selectedStatus);
    }
    
    return filtered;
  }, [data?.data, selectedProject, selectedStatus]);

  const hasFilters = (selectedProject && selectedProject !== 'all') || (selectedStatus && selectedStatus !== 'all');
  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedStatus('all');
    setPage(1);
  };

  const requisitions = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Helmet>
        <title>Mis Requisiciones - ComerECO</title>
        <meta name="description" content="Vea y gestione sus requisiciones de compra." />
      </Helmet>

      <PageContainer>
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <header className="mb-6 border-b border-border pb-4 sm:mb-8 sm:pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Mis Requisiciones
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Historial y seguimiento de todas tus solicitudes
                </p>
              </div>
              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[auto_auto] sm:items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-12 w-12 rounded-xl border border-border bg-card shadow-sm hover:bg-muted"
                >
                  <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin text-primary-500' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  onClick={() => navigate('/requisitions/new')}
                  size="lg"
                  className="w-full rounded-xl shadow-lg sm:w-auto"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Requisición
                </Button>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 surface-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Filtros:</span>
            </div>
            <Select value={selectedProject} onValueChange={(value) => { setSelectedProject(value); setPage(1); }}>
              <SelectTrigger className="w-full min-w-[200px] rounded-xl sm:w-[220px]">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(1); }}>
              <SelectTrigger className="w-full min-w-[200px] rounded-xl sm:w-[220px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="submitted">Enviada</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="ordered">Ordenada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full rounded-xl border border-transparent text-muted-foreground hover:border-border hover:text-foreground sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>

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
          ) : filteredRequisitions.length > 0 ? (
            <>
              {/* Requisitions Count */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="icon-badge flex h-10 w-10 items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600 dark:text-primary-100" />
                </div>
                <p className="text-sm text-muted-foreground sm:text-base">
                  <span className="mr-1 text-2xl font-bold text-foreground sm:text-3xl">
                    {hasFilters ? filteredRequisitions.length : totalCount}
                  </span>
                  {hasFilters ? 'requisiciones encontradas' : 'requisiciones en total'}
                </p>
              </div>

              {/* Requisitions List */}
              <div className="space-y-6">
                {filteredRequisitions.map((requisition) => (
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
              <div className="surface-card mx-auto max-w-lg p-16 shadow-xl">
                <EmptyState
                  icon={FileText}
                  title={hasFilters ? "No se encontraron requisiciones" : "No tienes requisiciones"}
                  description={hasFilters
                    ? "Intenta ajustar los filtros para ver más resultados."
                    : "Tus requisiciones aparecerán aquí una vez que las crees. Haz clic en el botón para comenzar."
                  }
                  action={hasFilters ? {
                    label: 'Limpiar filtros',
                    onClick: clearFilters,
                    icon: X
                  } : {
                    label: 'Nueva Requisición',
                    onClick: () => navigate('/requisitions/new'),
                    icon: Plus
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export default RequisitionsPage;
