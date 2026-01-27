import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
      }}
    >
      <span style={{ color: 'white', fontWeight: 'bold' }}>D</span>
    </div>,
    {
      ...size,
    }
  );
}
