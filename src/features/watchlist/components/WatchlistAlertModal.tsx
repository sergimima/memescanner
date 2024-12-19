import React, { useState, useEffect } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';

interface WatchlistAlertModalProps {
  tokenAddress: string;
  onClose: () => void;
}

export function WatchlistAlertModal({ tokenAddress, onClose }: WatchlistAlertModalProps) {
  const { watchlist, updatePriceAlert } = useWatchlist();
  const [above, setAbove] = useState<string>('');
  const [below, setBelow] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (watchlist) {
      const item = watchlist.items.find(
        item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (item) {
        setAbove(item.priceAlert?.above?.toString() || '');
        setBelow(item.priceAlert?.below?.toString() || '');
        setNotes(item.notes || '');
      }
    }
  }, [watchlist, tokenAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updatePriceAlert(tokenAddress, {
        above: above ? parseFloat(above) : undefined,
        below: below ? parseFloat(below) : undefined
      });
      onClose();
    } catch (error) {
      console.error('Error actualizando alertas:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Configurar Alertas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Alerta cuando el precio suba de
            </label>
            <input
              type="number"
              step="any"
              value={above}
              onChange={(e) => setAbove(e.target.value)}
              placeholder="Ej: 1.5"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Alerta cuando el precio baje de
            </label>
            <input
              type="number"
              step="any"
              value={below}
              onChange={(e) => setBelow(e.target.value)}
              placeholder="Ej: 0.5"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre este token..."
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
