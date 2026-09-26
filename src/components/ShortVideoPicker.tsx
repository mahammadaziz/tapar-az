import { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { DeleteOutlined, VideoCameraOutlined } from '@ant-design/icons';

export default function ShortVideoPicker({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = (selected: File | undefined) => {
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    const isVideo = selected.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension ?? '');
    if (!isVideo) { message.error('Yalnız MP4, MOV və ya WEBM video seçin.'); return; }
    if (selected.size > 100 * 1024 * 1024) { message.error('Short video maksimum 100 MB ola bilər.'); return; }
    const video = document.createElement('video');
    video.preload = 'metadata'; video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 60) { message.error('Short video maksimum 60 saniyə ola bilər.'); return; }
      onChange(selected);
    }; video.onerror = () => message.error('Video oxuna bilmədi.'); video.src = URL.createObjectURL(selected);
  };
  return <div className="rounded-2xl border border-dashed border-action/40 bg-action/5 p-5"><div className="flex items-start gap-3"><VideoCameraOutlined className="mt-1 text-xl text-action" /><div className="min-w-0 flex-1"><h3 className="font-semibold text-ink dark:text-white">Short video əlavə et</h3><p className="mt-1 text-xs text-muted">Bu video adi elan mediasından ayrı olaraq “Videolar” bölməsində göstəriləcək. MP4, MOV və WEBM · maksimum 60 saniyə / 100 MB.</p></div></div>{file && preview ? <div className="mt-4 flex items-center gap-4"><video src={preview} controls className="h-40 w-28 rounded-xl bg-black object-cover" /><div><p className="max-w-[220px] truncate text-sm font-medium text-ink dark:text-white">{file.name}</p><Button danger size="small" className="mt-2" icon={<DeleteOutlined />} onClick={() => onChange(null)}>Videonu sil</Button></div></div> : <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-line bg-paper px-4 py-5 text-sm font-semibold text-action transition hover:border-action dark:border-line-dark dark:bg-graphite">Video seç<input type="file" hidden accept="video/mp4,video/quicktime,video/webm,.mov" onChange={(event) => choose(event.target.files?.[0])} /></label>}</div>;
}
