import { useState, useEffect } from 'react';

export const useOllamaFetch = (prompt: string, model: string = 'llama3') => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, prompt }),
        });
        const data = await res.json();
        setResponse(data.text);
      } catch (err) {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (prompt) {
      fetchData();
    }
  }, [prompt, model]);

  return { response, loading, error };
};