import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Loader2, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function PdfViewer({ selectedDoc, activePage }) {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [page, setPage] = useState(activePage || 1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (activePage) {
      setPage(activePage);
    }
  }, [activePage]);

  useEffect(() => {
    if (!selectedDoc) {
      setDownloadUrl('');
      setFetchError('');
      return;
    }

    if (selectedDoc.status === 'FAILED') {
      setDownloadUrl('');
      setLoading(false);
      return;
    }

    const fetchUrl = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const res = await api.get(`/documents/${selectedDoc.id}/`);
        setDownloadUrl(res.data.download_url);
      } catch (err) {
        console.error('Erreur chargement PDF URL:', err);
        setFetchError('Impossible de charger le lien du PDF.');
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [selectedDoc]);

  if (!selectedDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <FileText className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-medium">Aucun PDF actif</p>
        <p className="text-xs text-slate-600 mt-1">Sélectionnez un document pour afficher le visualiseur source.</p>
      </div>
    );
  }

  if (selectedDoc.status === 'FAILED') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-rose-300">Échec du traitement du document</p>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          {selectedDoc.failure_reason || "Le fichier n'a pas pu être extrait ou est introuvable sur le serveur de stockage."}
        </p>
        <p className="text-[11px] text-slate-500 mt-3">
          Vous pouvez supprimer cette entrée et re-téléverser le document.
        </p>
      </div>
    );
  }

  if (selectedDoc.status === 'PROCESSING') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-xs font-semibold text-slate-200">Document en cours de traitement...</p>
        <p className="text-[11px] text-slate-500 mt-1">Extraction du texte et vectorisation Chroma DB en cours.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs">Chargement du document PDF depuis MinIO...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/60">
      {/* Controls toolbar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between glass-panel">
        <div className="flex items-center gap-2 text-xs text-slate-300 truncate max-w-[200px]">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate font-medium">{selectedDoc.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-300 font-mono">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="Page suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs transition ml-2 flex items-center gap-1"
              title="Télécharger le PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 w-full bg-slate-950 overflow-hidden relative">
        {downloadUrl ? (
          <iframe
            src={`${downloadUrl}#page=${page}`}
            title="Visualiseur PDF Source"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Aperçu indisponible
          </div>
        )}
      </div>
    </div>
  );
}
