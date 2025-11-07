import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, FileText, TrendingUp, Calendar, Shield, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/useToast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getProjectDetails } from '@/services/projectService';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { SectionIcon } from '@/components/ui/icon-wrapper';
import PageLoader from '@/components/PageLoader';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageProjects } = useUserPermissions();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['projectDetails', projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId
  });

  const handleNavigateBack = () => {
    navigate('/projects');
  };

  const handleNavigateToRequisition = (requisitionId) => {
    navigate(`/requisitions/${requisitionId}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          {/* Header Skeleton */}
          <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-lg sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-start gap-3 sm:gap-4 sm:w-auto">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-96" />
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                  
                
              
            
          

          {/* Statistics Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border-2 border-border bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-16" />
                  
                  <Skeleton className="h-8 w-8 rounded-lg" />
                
              
            ))}
          

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl border-2 border-border bg-card shadow-lg">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-7 w-48" />
                  
                
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-20 w-full rounded-xl" />
                  ))}
                
              
            ))}
          
        
      </PageContainer>
    );
  }

  if (isError || !project) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-2">Proyecto no encontrado</h2>
          <p className="text-muted-foreground mb-4">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={handleNavigateBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Button>
        
      
    );
  }

  const statusConfig = {
    active: { text: 'Activo', variant: 'success', accent: 'bg-gradient-accent' },
    archived: { text: 'Archivado', variant: 'muted', accent: 'bg-muted' },
  };

  const requisitionStatusConfig = {
    draft: { text: 'Borrador', variant: 'muted' },
    submitted: { text: 'Enviada', variant: 'warning' },
    approved: { text: 'Aprobada', variant: 'success' },
    rejected: { text: 'Rechazada', variant: 'danger' },
    ordered: { text: 'Ordenada', variant: 'info' },
    cancelled: { text: 'Cancelada', variant: 'muted' },
  };

  const currentStatus = statusConfig[project.status] || statusConfig.active;
  const isActive = project.status === 'active';

  // Calcular estadísticas
  const totalRequisitions = project.requisitions?.length || 0;
  const approvedRequisitions = project.requisitions?.filter(r => r.business_status === 'approved').length || 0;
  const pendingRequisitions = project.requisitions?.filter(r => r.business_status === 'submitted').length || 0;
  const totalAmount = project.requisitions?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;

  return (
    <>
      <Helmet>
        <title>{project.name} - ComerECO</title>
      </Helmet>
      <PageContainer>
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="relative overflow-hidden rounded-2xl border-2 border-border bg-card p-5 shadow-lg transition-shadow duration-300 hover:shadow-xl sm:p-8">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${currentStatus.accent}`} />
            
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-start gap-3 sm:gap-4 sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNavigateBack}
                  aria-label="Volver"
                  className="rounded-xl border-border bg-card shadow-sm transition-all hover:border-primary-200 hover:bg-primary-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">{project.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge variant={isActive ? 'success' : 'muted'} className="shadow-sm">
                      {isActive ? 'Activo' : 'Archivado'}
                    </Badge>
                    <Badge variant={currentStatus.variant} className="shadow-sm">
                      {currentStatus.text}
                    </Badge>
                    {project.supervisor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="font-semibold">Supervisor:</span>
                        <span>{project.supervisor.full_name}</span>
                      
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Creado: {format(new Date(project.created_at), 'dd MMM, yyyy', { locale: es })}</span>
                    
                  
                
              
            
          </header>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Requisiciones</p>
                    <p className="text-3xl font-bold text-foreground">{totalRequisitions}</p>
                  
                  <FileText className="h-8 w-8 text-primary-600" />
                
              </CardContent>
            </Card>
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Aprobadas</p>
                    <p className="text-3xl font-bold text-green-600">{approvedRequisitions}</p>
                  
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                
              </CardContent>
            </Card>
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-amber-600">{pendingRequisitions}</p>
                  
                  <Clock className="h-8 w-8 text-amber-600" />
                
              </CardContent>
            </Card>
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Invertido</p>
                    <p className="text-3xl font-bold text-foreground">${totalAmount.toFixed(2)}</p>
                  
                  <TrendingUp className="h-8 w-8 text-primary-600" />
                
              </CardContent>
            </Card>
          

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Members Card */}
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={FolderKanban} />
                    <Users className="h-6 w-6 text-primary-600 dark:text-primary-100" />
                  
                  <CardTitle className="text-2xl font-bold text-foreground">Miembros del Proyecto</CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-4">
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member) => {
                      const memberProfile = member.user ?? member.profile;
                      return (
                        <div
                          key={member.membership_id || member.user_id}
                          className="flex items-center justify-between p-4 bg-muted/70 rounded-xl border-2 border-border hover:border-primary-200 transition-colors"
                        >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={memberProfile?.avatar_url} />
                            <AvatarFallback>
                              {memberProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {memberProfile?.full_name || 'Usuario Desconocido'}
                            </p>
                            <p className="text-sm text-muted-foreground">{memberProfile?.email}</p>
                          
                        
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">
                            {member.role_in_project || 'Miembro'}
                          </Badge>
                          {member.requires_approval && (
                            <Badge variant="warning" className="text-xs">
                              Requiere Aprobación
                            </Badge>
                          )}
                        
                        
                      );
                    })}
                  
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No hay miembros"
                    description="Este proyecto aún no tiene miembros asignados."
                  />
                )}
              </CardContent>
            </Card>

            {/* Requisitions Card */}
            <Card className="shadow-lg border-2 transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={FolderKanban} />
                    <FileText className="h-6 w-6 text-primary-600 dark:text-primary-100" />
                  
                  <CardTitle className="text-2xl font-bold text-foreground">Requisiciones Recientes</CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-4">
                {project.requisitions && project.requisitions.length > 0 ? (
                  <div className="space-y-3">
                    {project.requisitions.slice(0, 10).map((requisition) => {
                      const status = requisitionStatusConfig[requisition.business_status] || requisitionStatusConfig.draft;
                      return (
                        <div
                          key={requisition.id}
                          onClick={() => handleNavigateToRequisition(requisition.id)}
                          className="group cursor-pointer p-4 bg-muted/70 rounded-xl border-2 border-border hover:border-primary-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono font-semibold text-foreground">
                                #{requisition.internal_folio}
                              </span>
                            
                            <Badge variant={status.variant} className="text-xs">
                              {status.text}
                            </Badge>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {requisition.creator?.full_name || 'Desconocido'}
                            </span>
                            <span className="font-semibold text-foreground">
                              ${(Number(requisition.total_amount) || 0).toFixed(2)}
                            </span>
                          
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            {format(new Date(requisition.created_at), 'dd MMM, yyyy HH:mm', { locale: es })}
                          </p>
                        
                      );
                    })}
                    {project.requisitions.length > 10 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/requisitions', { state: { projectId: project.id } })}
                      >
                        Ver todas las requisiciones ({project.requisitions.length})
                      </Button>
                    )}
                  
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No hay requisiciones"
                    description="Este proyecto aún no tiene requisiciones."
                  />
                )}
              </CardContent>
            </Card>
          
        
      </PageContainer>
    </>
  );
};

export default ProjectDetail;
