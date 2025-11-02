
import React from 'react';
import { Helmet } from 'react-helmet';
import EmptyState from '@/components/EmptyState';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet><title>Mis Favoritos - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <EmptyState
                    icon={Star}
                    title="Aún no tienes favoritos"
                    description="Explora el catálogo y marca los productos que más te gustan para encontrarlos aquí fácilmente."
                    actionButton={
                        <Button onClick={() => navigate('/catalog')} size="lg" className="shadow-lg hover:shadow-xl">
                            Explorar Catálogo
                        </Button>
                    }
                />
            </div>
        </>
    );
};

export default FavoritesPage;
