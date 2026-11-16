import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { WebReader } from '../components/reader/WebReader';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ReaderPage: React.FC = () => {
  const { articleId, id: paramId } = useParams<{ articleId?: string; id?: string }>();
  const id = articleId || paramId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readerData, setReaderData] = useState<any | null>(null);

  const loadArticle = (isSilent = false) => {
    if (!id) {
      setError('Article ID is required.');
      setLoading(false);
      return;
    }

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    api.articles
      .getReaderView(id)
      .then((res: any) => {
        const payload = res?.data || res;
        if (payload && (payload.article || payload.paragraphs)) {
          setReaderData(payload);
        } else {
          setError(res?.error || 'Failed to load article.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error while loading article.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
        <p className="font-mono font-semibold text-ink-muted dark:text-ink-pewter text-sm">
          Preparing reader sheet and smart highlights...
        </p>
      </div>
    );
  }

  if (error || !readerData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark text-center">
        <div className="brutal-card p-8 max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="font-sans text-2xl font-extrabold">Could Not Open Article</h1>
          <p className="text-sm text-ink-muted dark:text-ink-pewter">
            {error || 'Article content could not be located in your Vault storage.'}
          </p>
          <Link
            to="/"
            className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-sm font-extrabold bg-violet-brand text-white hover:bg-violet-hover"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Library</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WebReader
      article={readerData.article}
      paragraphs={readerData.paragraphs}
      onMineSuccess={() => loadArticle(true)}
    />
  );
};
