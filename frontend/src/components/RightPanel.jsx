import React, { useState, useEffect } from 'react';
import { HelpCircle, FileText, Sparkles, CheckCircle, XCircle, Award, ArrowRight, Loader2, RotateCcw, ListChecks } from 'lucide-react';
import api from '../api';
import PdfViewer from './PdfViewer';

export default function RightPanel({
  selectedDoc,
  activePdfPage,
  autoStartQuizDocId,
  onResetAutoStartQuiz,
}) {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'pdf'
  const [quizList, setQuizList] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // { question_id: "B" or "Vrai" or text }
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submittedQuizResult, setSubmittedQuizResult] = useState(null);
  const [difficulty, setDifficulty] = useState('MOYEN');
  const [numQuestions, setNumQuestions] = useState(5);

  const fetchQuizHistory = async () => {
    try {
      const res = await api.get('/quiz/');
      setQuizList(res.data);
    } catch (err) {
      console.error('Erreur chargement quiz:', err);
    }
  };

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useEffect(() => {
    if (activePdfPage) {
      setActiveTab('pdf');
    }
  }, [activePdfPage]);

  useEffect(() => {
    if (autoStartQuizDocId) {
      setActiveTab('quiz');
      handleGenerateQuiz(autoStartQuizDocId);
      if (onResetAutoStartQuiz) onResetAutoStartQuiz();
    }
  }, [autoStartQuizDocId]);

  const handleGenerateQuiz = async (docId = selectedDoc?.id) => {
    if (!docId) return;
    setGenerating(true);
    setSubmittedQuizResult(null);
    setActiveQuiz(null);
    setUserAnswers({});

    try {
      const res = await api.post('/quiz/generate/', {
        document_id: docId,
        num_questions: numQuestions,
        difficulty: difficulty,
      });
      setActiveQuiz(res.data);
      fetchQuizHistory();
    } catch (err) {
      console.error('Erreur génération quiz:', err);
      alert(err.response?.data?.detail || 'Erreur lors de la génération du quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);

    try {
      const answersPayload = activeQuiz.questions.map((q) => ({
        question_id: q.id,
        answer: userAnswers[q.id] || '',
      }));

      const res = await api.post(`/quiz/${activeQuiz.id}/submit/`, {
        answers: answersPayload,
      });

      setSubmittedQuizResult(res.data);
      fetchQuizHistory();
    } catch (err) {
      console.error('Erreur soumission quiz:', err);
      alert('Erreur lors de la soumission du quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="w-96 border-l border-slate-800 glass-panel flex flex-col h-[calc(100vh-4rem)]">
      {/* Tab Header */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2 glass-panel">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'quiz'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quiz & Synthèses
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'pdf'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" /> Source PDF
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'pdf' ? (
          <PdfViewer selectedDoc={selectedDoc} activePage={activePdfPage} />
        ) : (
          <div className="space-y-6">
            {/* Generate Quiz Card */}
            {!activeQuiz && !submittedQuizResult && (
              <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Générateur de Quiz CrewAI</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    L'Agent Générateur crée un quiz sur mesure (QCM, VF, Questions Ouvertes) à partir de votre document.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Niveau</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="FACILE">Facile</option>
                      <option value="MOYEN">Moyen</option>
                      <option value="DIFFICILE">Difficile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Questions</label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateQuiz()}
                  disabled={!selectedDoc || generating}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Génération du Quiz en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Générer un Quiz Interactif
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quiz Player */}
            {activeQuiz && !submittedQuizResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Quiz Niveau {activeQuiz.difficulty}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">
                      {activeQuiz.questions.length} Question(s)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>

                <div className="space-y-4">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="glass-card p-4 rounded-xl space-y-3 border border-slate-800">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                          Q{idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-white leading-snug">{q.text}</p>
                      </div>

                      {/* QCM Options */}
                      {q.type === 'QCM' && q.options && (
                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const optKey = String.fromCharCode(65 + oIdx); // A, B, C, D
                            const isSelected = userAnswers[q.id] === optKey;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => setUserAnswers({ ...userAnswers, [q.id]: optKey })}
                                className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                                }`}
                              >
                                <span className="font-bold text-indigo-400">{optKey}.</span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Vrai / Faux */}
                      {q.type === 'VRAI_FAUX' && (
                        <div className="flex gap-2 pt-1">
                          {['Vrai', 'Faux'].map((vf) => {
                            const isSelected = userAnswers[q.id] === vf;
                            return (
                              <button
                                key={vf}
                                onClick={() => setUserAnswers({ ...userAnswers, [q.id]: vf })}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                  isSelected
                                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                                }`}
                              >
                                {vf}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Question Ouverte */}
                      {q.type === 'OUVERTE' && (
                        <textarea
                          rows={2}
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                          placeholder="Rédigez votre réponse synthétique..."
                          className="w-full p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Soumettre au Correcteur CrewAI
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Submitted Quiz Results */}
            {submittedQuizResult && (
              <div className="space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 text-center space-y-2 bg-emerald-950/20">
                  <Award className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Résultats du Quiz</h3>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {submittedQuizResult.score}%
                  </div>
                  <p className="text-xs text-slate-400">
                    Correction effectuée par l'Agent d'Évaluation CrewAI (un e-mail récapitulatif vous a été envoyé).
                  </p>
                </div>

                {/* Detailed Questions Review */}
                <div className="space-y-3">
                  {submittedQuizResult.questions.map((q, idx) => (
                    <div key={q.id} className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-slate-300">Q{idx + 1}. {q.text}</span>
                        {q.is_correct ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <div><strong className="text-slate-300">Votre réponse:</strong> {q.submitted_answer || 'Aucune'}</div>
                        <div><strong className="text-emerald-300">Réponse attendue:</strong> {q.correct_answer}</div>
                        {q.explanation && (
                          <div className="text-[11px] text-indigo-300 pt-1 italic">{q.explanation}</div>
                        )}
                        {q.feedback && (
                          <div className="text-[11px] text-amber-300 pt-1">
                            <strong>Feedback LLM:</strong> {q.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setSubmittedQuizResult(null);
                    setActiveQuiz(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Relancer un nouveau Quiz
                </button>
              </div>
            )}

            {/* Quiz History List */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-indigo-400" /> Historique de vos Quiz ({quizList.length})
              </h4>
              <div className="space-y-2">
                {quizList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">Aucun quiz effectué pour le moment.</p>
                ) : (
                  quizList.slice(0, 5).map((q) => (
                    <div key={q.id} className="glass-card p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">Quiz #{q.id} — {q.difficulty}</div>
                        <div className="text-[10px] text-slate-500">{new Date(q.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div className="font-bold text-emerald-400 text-sm">
                        {q.score !== null ? `${q.score}%` : 'En cours'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
