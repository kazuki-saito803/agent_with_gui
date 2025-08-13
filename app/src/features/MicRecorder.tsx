import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Circle, Pause, Mic, Download, RefreshCw } from "lucide-react";

/**
 * TypeScript + React マイク録音コンポーネント
 * - MediaRecorder API を使用
 * - 入力デバイス選択 / レベルメーター表示
 * - 一時停止・再開 / 再生 / ダウンロード
 * - onSave コールバックで Blob を呼び出し元に渡せます
 *
 * 使い方：
 * <MicRecorder onSave={(blob) => upload somewhere} />
 */
export default function MicRecorder({
  preferredMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ],
  onSave,
  filename = "recording",
  autoGainControl = true,
  noiseSuppression = true,
  echoCancellation = true,
}: {
  preferredMimeTypes?: string[];
  onSave?: (blob: Blob, mimeType: string) => void;
  filename?: string; // ダウンロード時のファイル名（拡張子は自動付与）
  autoGainControl?: boolean;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
}) {
  const [supportedMime, setSupportedMime] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState<string>("");
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [error, setError] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [level, setLevel] = useState(0); // 0..1

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // 利用可能な MIME タイプから最適なものを選択
  useEffect(() => {
    for (const mime of preferredMimeTypes) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(mime)) {
        setSupportedMime(mime);
        return;
      }
    }
    // Fallback（ブラウザに選ばせる）
    setSupportedMime("");
  }, [preferredMimeTypes]);

  // デバイス列挙（権限付与後に呼ぶとラベルが取得できる）
  const enumerate = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all.filter((d) => d.kind === "audioinput");
      setDevices(inputs);
      if (!deviceId && inputs[0]) setDeviceId(inputs[0].deviceId);
    } catch (e: any) {
      setError(e?.message || "デバイス一覧の取得に失敗しました");
    }
  };

  const askPermission = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          autoGainControl,
          noiseSuppression,
          echoCancellation,
        },
      });
      streamRef.current = stream;
      setPermission("granted");
      await enumerate();
      initAnalyser(stream);
    } catch (e: any) {
      setPermission("denied");
      setError(e?.message || "マイク権限の取得に失敗しました");
    }
  };

  const initAnalyser = (stream: MediaStream) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      tickLevel();
    } catch (e) {
      // Safari などで失敗しても致命的ではないので握りつぶす
      console.warn("Analyser init failed", e);
    }
  };

  const tickLevel = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    const draw = () => {
      if (!analyserRef.current) return;
      analyser.getByteTimeDomainData(dataArray);
      // 波形のRMSから簡易レベル算出
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128; // -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setLevel(Math.min(1, rms * 2));
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  };

  const start = async () => {
    setError("");
    try {
      if (!streamRef.current) {
        await askPermission();
      }
      const stream = streamRef.current!;
      const mr = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || supportedMime || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        if (onSave) onSave(blob, mr.mimeType || supportedMime || "audio/webm");
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setIsPaused(false);
    } catch (e: any) {
      setError(e?.message || "録音開始に失敗しました");
    }
  };

  const stop = () => {
    const mr = mediaRecorderRef.current;
    if (mr && (mr.state === "recording" || mr.state === "paused")) {
      mr.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const pause = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") {
      mr.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "paused") {
      mr.resume();
      setIsPaused(false);
    }
  };

  const clearAudio = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL("");
  };

  const refreshDevices = async () => {
    await enumerate();
  };

  const download = () => {
    if (!audioURL) return;
    const mime = mediaRecorderRef.current?.mimeType || supportedMime || "audio/webm";
    const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
    const a = document.createElement("a");
    a.href = audioURL;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // デバイス切替時はストリームを再生成
  useEffect(() => {
    if (permission !== "granted") return;
    (async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            autoGainControl,
            noiseSuppression,
            echoCancellation,
          },
        });
        streamRef.current = stream;
        initAnalyser(stream);
      } catch (e: any) {
        setError(e?.message || "デバイス切替に失敗しました");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioURL) URL.revokeObjectURL(audioURL);
      audioCtxRef.current?.close();
    };
  }, [audioURL]);

  const LevelBar = () => (
    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        style={{ width: `${Math.round(level * 100)}%` }}
        className="h-full bg-green-500 transition-[width] duration-75"
      />
    </div>
  );

  const canRecord = typeof window !== "undefined" && !!(navigator.mediaDevices && window.MediaRecorder);

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 rounded-2xl shadow-md bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-5 h-5" />
        <h2 className="text-lg font-semibold">マイク録音</h2>
      </div>

      {!canRecord && (
        <p className="text-sm text-red-600">
          このブラウザは MediaRecorder をサポートしていません。Chrome / Edge / Firefox をご利用ください。
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 mb-2">{error}</div>
      )}

      <div className="grid gap-3 mb-4">
        <label className="text-sm font-medium">入力デバイス</label>
        <div className="flex gap-2 items-center">
          <select
            className="w-full border rounded-xl p-2"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            onFocus={() => enumerate()}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `マイク (${d.deviceId.slice(0, 6)}…)`}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-gray-50"
            onClick={refreshDevices}
            title="デバイスを再取得"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <LevelBar />
        <div className="text-xs text-gray-500 mt-1">入力レベル</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {permission !== "granted" ? (
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white hover:opacity-90"
            onClick={askPermission}
          >
            <Mic className="w-4 h-4" /> マイクを許可
          </button>
        ) : !isRecording ? (
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white hover:opacity-90"
            onClick={start}
          >
            <Circle className="w-4 h-4" /> 録音開始
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border hover:bg-gray-50"
                onClick={pause}
              >
                <Pause className="w-4 h-4" /> 一時停止
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border hover:bg-gray-50"
                onClick={resume}
              >
                <Play className="w-4 h-4" /> 再開
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 text-white hover:opacity-90"
              onClick={stop}
            >
              <Square className="w-4 h-4" /> 停止
            </button>
          </>
        )}
      </div>

      {audioURL && (
        <div className="grid gap-2">
          <audio controls src={audioURL} className="w-full" />
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border hover:bg-gray-50"
              onClick={download}
            >
              <Download className="w-4 h-4" /> ダウンロード
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border hover:bg-gray-50"
              onClick={clearAudio}
            >
              クリア
            </button>
          </div>
          <p className="text-xs text-gray-500">
            * ブラウザがサポートする形式で保存されます（例: webm/ogg/m4a）。Safari は mp4(m4a) になる場合があります。
          </p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p>ヒント: 初回はマイク許可が必要です。許可後にデバイス名が表示されます。</p>
        <p>互換性: MediaRecorder は最新の Chrome / Edge / Firefox / Safari の新しめのバージョンで動作します。</p>
      </div>
    </div>
  );
}