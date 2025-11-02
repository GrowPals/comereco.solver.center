
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ShoppingCart, Users, CheckSquare, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import HeroCard from '@/components/HeroCard';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const StatCard = ({ title, value, icon, color, loading }) => {
  const Icon = icon;
  if (loading) {
    return <Skeleton className="h-[128px] w-full rounded-xl bg-[var(--neutral-10)]" />;
  }
  return (
    <Card className="overflow-hidden border-[var(--neutral-10)] rounded-xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <CardTitle className="text-sm font-semibold text-[var(--neutral-60)]">{title}</CardTitle>
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-3xl font-bold text-[var(--neutral-100)]">{value}</div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);

  // Mock loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const isAdminOrSupervisor = user?.role === 'admin_corp' || user?.role === 'super_admin';

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stats = [
    {
      title: 'Valor Total Pedidos',
      value: '$12,450',
      icon: DollarSign,
      color: 'text-[var(--success-50)]',
    },
    { title: 'Pedidos Pendientes', value: '15', icon: Clock, color: 'text-[var(--warning-50)]' },
    {
      title: 'Nuevos Usuarios',
      value: '+23',
      icon: Users,
      color: 'text-[var(--primary-50)]',
      adminOnly: true,
    },
    {
      title: 'Aprobaciones',
      value: '8',
      icon: CheckSquare,
      color: 'text-[var(--info-50)]',
      adminOnly: true,
    },
  ].filter((stat) => isAdminOrSupervisor || !stat.adminOnly);

  return (
    <>
      <Helmet>
        <title>Dashboard - ComerECO</title>
        <meta name="description" content="Resumen y estadísticas de ComerECO." />
      </Helmet>

      <AnimatePresence>
        <motion.div
          className="px-5 py-6 space-y-8 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {/* Welcome Header */}
            <motion.div variants={itemVariants}>
              <h1 className="text-2xl font-bold text-[var(--neutral-100)]">
                Hola, {user?.full_name || 'Usuario'}
              </h1>
              <p className="text-sm text-[var(--neutral-60)] mt-1">
                Bienvenido de vuelta, aquí está tu resumen
              </p>
            </motion.div>

            {/* Hero Card */}
            <motion.div variants={itemVariants}>
              <HeroCard />
            </motion.div>

            {/* Stats Grid */}
            {isAdminOrSupervisor && (
              <motion.div variants={itemVariants}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} loading={loading} />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default Dashboard;
