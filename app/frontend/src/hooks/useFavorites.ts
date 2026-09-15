
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteReport {
    id: string;
    id_user: string;
    id_report: string;
    added_at: string;
}

export const useFavorites = (userId?: string) => {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchFavorites = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await api.get<FavoriteReport[]>(`/api/v1/favorites/${userId}`);
            setFavorites(data.map(f => f.id_report));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const addFavorite = async (reportId: string) => {
        if (!userId) return;

        // Optimistic update
        setFavorites(prev => [...prev, reportId]);

        try {
            await api.post('/api/v1/favorites', { id_user: userId, id_report: reportId });
            toast({
                title: "Añadido a favoritos",
                description: "El reporte se ha guardado en tus favoritos",
            });
        } catch (error) {
            console.error('Error adding favorite:', error);
            // Revert optimistic update
            setFavorites(prev => prev.filter(id => id !== reportId));
            toast({
                title: "Error",
                description: "No se pudo añadir a favoritos",
                variant: "destructive"
            });
        }
    };

    const removeFavorite = async (reportId: string) => {
        if (!userId) return;

        // Optimistic update
        setFavorites(prev => prev.filter(id => id !== reportId));

        try {
            await api.delete(`/api/v1/favorites/${userId}/${reportId}`);
            toast({
                title: "Eliminado de favoritos",
                description: "El reporte se ha eliminado de tus favoritos",
            });
        } catch (error) {
            console.error('Error removing favorite:', error);
            // Revert optimistic update
            setFavorites(prev => [...prev, reportId]);
            toast({
                title: "Error",
                description: "No se pudo eliminar de favoritos",
                variant: "destructive"
            });
        }
    };

    const isFavorite = (reportId: string) => favorites.includes(reportId);

    const toggleFavorite = (reportId: string) => {
        if (isFavorite(reportId)) {
            removeFavorite(reportId);
        } else {
            addFavorite(reportId);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [userId]);

    return {
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        refreshFavorites: fetchFavorites
    };
};
