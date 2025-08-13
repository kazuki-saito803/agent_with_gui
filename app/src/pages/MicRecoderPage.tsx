import MicRecorder from "../features/MicRecorder";

export default function Page() {
  return (
    <div className="p-6">
      <MicRecorder
        onSave={(blob, mime) => {
          // ここでアップロードやサーバ送信が可能
          console.log("saved:", blob.type || mime, blob.size);
        }}
        filename="my_recording"
      />
    </div>
  );
}