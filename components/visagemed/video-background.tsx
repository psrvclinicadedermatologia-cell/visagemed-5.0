export function VideoBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-20 overflow-hidden">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-40"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-99786-large.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Overlay de gradiente sobre o vídeo */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(10, 132, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(10, 132, 255, 0.05) 0%, transparent 50%), linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </>
  )
}
