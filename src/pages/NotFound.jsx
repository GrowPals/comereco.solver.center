
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Página no encontrada - ComerECO</title>
      </Helmet>
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background/97 to-background p-4 dark:from-[#131f33] dark:via-[#101a2e] dark:to-[#0d1729]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="border border-border shadow-soft-lg dark:border-border">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-500/20 dark:to-red-600/15">
                  <Search className="h-12 w-12 text-red-600 dark:text-red-300" />
                </div>
              </motion.div>
              
              <h1 className="mb-4 text-5xl font-bold text-foreground">
                404
              </h1>
              
              <h2 className="mb-3 text-2xl font-semibold text-foreground">
                Página no encontrada
              </h2>
              
              <p className="mb-8 text-muted-foreground">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  className="shadow-md hover:shadow-soft-md"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Ir al inicio
                </Button>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  size="lg"
                  className="shadow-sm"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver atrás
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default NotFoundPage;
