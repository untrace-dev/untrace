import { ImageResponse } from 'next/og';

export const size = {
  height: 630,
  width: 1200,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        padding: '60px',
        width: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
        }}
      >
        <svg
          fill="none"
          height="120"
          viewBox="0 0 384 323"
          width="120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Untrace Logo</title>
          <path
            d="M113.5 323L0 200.5L38.5 160H39.5L115.5 236.5L189.5 155L266 239L344 159.5L383.5 200.5L265 321.5L191.5 240.5L113.5 323Z"
            fill="white"
          />
          <path
            d="M191.5 86.5L269 172.5L310.5 129L191 0L73.5 129L113.5 171.5L191.5 86.5Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          color: 'white',
          fontSize: '72px',
          fontWeight: 'bold',
          lineHeight: '1.1',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Untrace
      </div>

      {/* Subtitle */}
      <div
        style={{
          color: '#a0a0a0',
          fontSize: '32px',
          lineHeight: '1.3',
          maxWidth: '800px',
          textAlign: 'center',
        }}
      >
        The Segment for LLM traces. Capture once, route everywhere.
      </div>

      {/* Tagline */}
      <div
        style={{
          color: '#666666',
          fontSize: '24px',
          marginTop: '20px',
          textAlign: 'center',
        }}
      >
        End vendor lock-in and observability tool sprawl
      </div>
    </div>,
    {
      ...size,
    },
  );
}
