
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
            <div className="h-full -mt-20 flex items-center justify-center">
                <EmptyState
                    icon={Star}
                    title="Aún no tienes favoritos"
                    description="Explora el catálogo y marca los productos que más te gustan para encontrarlos aquí fácilmente."
                    actionButton={
                        <Button onClick={() => navigate('/catalog')}>
                            Explorar Catálogo
                        </Button>
                    }
                />
            </div>
        </>
    );
};

export default FavoritesPage;
