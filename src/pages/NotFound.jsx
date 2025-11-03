
import React from 'react';
import { Helmet } from 'react-helmet';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="shadow-xl border-2 border-slate-200">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-red-100">
                  <Search className="h-12 w-12 text-red-600" />
                </div>
              </motion.div>
              
              <h1 className="text-5xl font-bold text-slate-900 mb-4">
                404
              </h1>
              
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                Página no encontrada
              </h2>
              
              <p className="text-slate-600 mb-8">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  className="shadow-md hover:shadow-lg"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Ir al Dashboard
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

