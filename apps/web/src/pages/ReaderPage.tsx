import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { WebReader } from '../components/reader/WebReader';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readerData, setReaderData] = useState<any | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Article ID is required.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.articles.getReaderView(id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setReaderData(res.data);
        } else {
          setError(res.error || 'Failed to load article.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Network error while loading article.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-rust mb-3" />
        <p className="font-serif text-ink-graphite dark:text-ink-pewter text-sm">
          Preparing distraction-free reader and highlights...
        </p>
      </div>
    );
  }

  if (error || !readerData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mb-3" />
        <h2 className="font-serif text-2xl font-bold mb-2">Could Not Open Article</h2>
        <p className="text-sm text-ink-graphite dark:text-ink-pewter mb-6 max-w-md">
          {error || 'Article content could not be located in your Vault storage.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm bg-editorial-rust text-white hover:bg-editorial-rust/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>
    );
  }

  return (
    <WebReader
      article={readerData.article}
      paragraphs={readerData.paragraphs}
    />
  );
};
