import { useState, useCallback } from 'react';

interface QueryRequest {
  question: string;
  top_k: number;
  index_name: string;
}

interface QueryResponse {
  answer: string;
  docs: string[];
}

const useFetchResponse = () => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResponse = useCallback(async (params: QueryRequest): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const json: QueryResponse = await res.json();
      setData(json.answer);
      return json.answer;
    } catch (err) {
      setError('Fetch error');
      return '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchResponse };
};

export default useFetchResponse;