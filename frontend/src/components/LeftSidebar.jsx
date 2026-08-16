import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import api from '../api';

export default function LeftSidebar({ documents, selectedDoc, onSelectDoc, onRefreshDocs }) {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadProgress('1/3 - Initialisation & URL MinIO...');

    try {
      const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
      
      // Step 1: Demand presigned URL from Django backend
      const res1 = await api.post('/documents/upload-url/', {
        file_name: file.name,
        size_mb: sizeMb,
      });

      const { document: docData, upload_url: uploadUrl } = res1.data;

      // Step 2: Direct PUT upload to MinIO
      setUploadProgress('2/3 - Transfert vers le stockage MinIO S3...');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Échec upload MinIO (${uploadRes.status}): ${uploadRes.statusText || errorText}`);
      }

      // Step 3: Confirm upload with backend -> triggers PDF extraction, chunking & embeddings
      setUploadProgress('3/3 - Extraction PDF & Vectorisation Chroma DB...');
      const res3 = await api.post(`/documents/${docData.id}/confirm-upload/`);

      if (res3.data.status === 'FAILED') {
        throw new Error(res3.data.failure_reason || 'Échec lors de l\'extraction du document.');
      }

      setShowModal(false);
      setFile(null);
      await onRefreshDocs();
      onSelectDoc(res3.data);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || err.response?.data?.failure_reason || err.message || 'Erreur lors de l\'upload du fichier.';
      setError(message);
      onRefreshDocs();
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous supprimer ce document et ses données vectorielles ?')) return;

    try {
      await api.delete(`/documents/${docId}/`);
      onRefreshDocs();
      if (selectedDoc?.id === docId) {
        onSelectDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatusBadge = (doc) => {
    switch (doc.status) {
      case 'READY':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Prêt
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse-subtle">
            <Loader2 className="w-3 h-3 animate-spin" /> Traitement
          </span>
        );
      case 'UPLOADED':
        return (
          <span className="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            <Clock className="w-3 h-3" /> Téléversé
          </span>
        );
      default:
        return (
          <span
            title={doc.failure_reason || 'Échec du traitement'}
            className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"
          >
            <AlertTriangle className="w-3 h-3" /> Échec
          </span>
        );
    }
  };

  return (
    <aside className="w-80 border-r border-slate-800 glass-panel flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Add Doc Button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white text-sm">Mes Documents PDF</h2>
          <p className="text-xs text-slate-400">{documents.length} document(s) disponibles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">Aucun document</p>
            <p className="text-xs text-slate-500 mt-1">Ajoutez un document PDF pour démarrer la révision RAG.</p>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`group relative p-3 rounded-xl cursor-pointer border transition ${
                  isSelected
                    ? 'bg-indigo-900/30 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                    : 'glass-card hover:bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      {renderStatusBadge(doc)}
                      <span className="text-[10px] text-slate-400">{doc.size_mb} MB</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    title="Supprimer le document"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" /> Ajouter un document PDF
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-900/50">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  id="pdf-file-input"
                  required
                />
                <label htmlFor="pdf-file-input" className="cursor-pointer block">
                  <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <span className="text-sm font-medium text-slate-200 block">
                    {file ? file.name : 'Cliquez pour choisir un PDF'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Format PDF jusqu\'à 50 MB'}
                  </span>
                </label>
              </div>

              {uploading && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? 'Traitement...' : 'Téléverser & Vectoriser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
