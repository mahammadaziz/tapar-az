import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, HeartOutlined, MessageOutlined, ShareAltOutlined, SoundFilled, SoundOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useShortVideos } from '@/hooks/useShortVideos';
import type { ShortVideo } from '@/types';

export default function Videos() {
  const { videos, loading } = useShortVideos(50);
  const [activeId, setActiveId] = useState('');
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  useEffect(() => {
    if (!videos.length) return undefined;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting && entry.intersectionRatio > 0.65) { setActiveId(video.dataset.videoId ?? ''); void video.play().catch(() => undefined); }
      else video.pause();
    }), { threshold: [0.25, 0.65, 0.9] });
    Object.values(videoRefs.current).forEach((video) => { if (video) observer.observe(video); });
    return () => observer.disconnect();
  }, [videos]);
  useEffect(() => { Object.values(videoRefs.current).forEach((video) => { if (video) video.muted = muted; }); }, [muted]);
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center text-muted">Videolar yüklənir…</div>;
  if (!videos.length) return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-3 px-6 text-center"><VideoCameraOutlined className="text-5xl text-action" /><h1 className="font-display text-2xl font-bold text-ink dark:text-white">Hələ video yoxdur</h1><p className="text-sm text-muted">Elan yerləşdirərkən ayrıca short video əlavə edə bilərsiniz.</p><Link to="/elan-yerlesdir" className="market-action">Elan yerləşdir</Link></div>;
  return <main className="shorts-page bg-[#101113] text-white"><div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 md:px-8"><Link to="/" className="pointer-events-auto flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"><ArrowLeftOutlined /> TAPAR.AZ</Link><div className="flex items-center gap-3"><span className="hidden text-sm font-semibold md:inline">Videolar</span><button type="button" onClick={() => setMuted((value) => !value)} className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur" aria-label={muted ? 'Səsi aç' : 'Səsi bağla'}>{muted ? <SoundOutlined /> : <SoundFilled />}</button></div></div><div className="shorts-feed h-[calc(100dvh-4rem)] overflow-y-auto snap-y snap-mandatory overscroll-contain md:h-screen">{videos.map((video) => <ShortVideoSlide key={video.id} video={video} active={activeId === video.id} muted={muted} videoRef={(element) => { videoRefs.current[video.id] = element; }} onShare={() => shareVideo(video)} />)}</div></main>;
}

function ShortVideoSlide({ video, active, muted, videoRef, onShare }: { video: ShortVideo; active: boolean; muted: boolean; videoRef: (element: HTMLVideoElement | null) => void; onShare: () => void }) {
  return <article className="relative flex h-[calc(100dvh-4rem)] min-h-[620px] snap-start items-center justify-center bg-[#101113] md:h-screen"><div className="relative h-full w-full overflow-hidden md:max-w-[520px] md:rounded-2xl md:border md:border-white/10 md:shadow-2xl"><video ref={videoRef} data-video-id={video.id} src={video.videoUrl} poster={video.coverUrl} muted={muted} loop playsInline preload={active ? 'auto' : 'metadata'} onClick={(event) => { const element = event.currentTarget; element.muted = !element.muted; }} className="h-full w-full bg-black object-contain md:object-cover" /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/25 to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7"><div className="min-w-0"><h1 className="text-xl font-bold drop-shadow md:text-2xl">{video.title}</h1>{video.description && <p className="mt-2 line-clamp-2 text-sm text-white/80">{video.description}</p>}{video.listingId && <Link to={`/elanlar/${video.listingId}`} className="pointer-events-auto mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-bold text-ink">Elana bax</Link>}</div><div className="flex shrink-0 flex-col items-center gap-5 text-white"><button type="button" className="flex flex-col items-center gap-1"><HeartOutlined className="text-3xl" /><span className="text-xs">{video.likeCount || 0}</span></button><button type="button" className="flex flex-col items-center gap-1"><MessageOutlined className="text-3xl" /><span className="text-xs">Şərh</span></button><button type="button" onClick={onShare} className="flex flex-col items-center gap-1"><ShareAltOutlined className="text-3xl" /><span className="text-xs">Paylaş</span></button></div></div></div></article>;
}

async function shareVideo(video: ShortVideo) {
  const url = `${window.location.origin}/videolar#${video.id}`;
  if (navigator.share) await navigator.share({ title: video.title, url }).catch(() => undefined);
  else await navigator.clipboard?.writeText(url);
}
