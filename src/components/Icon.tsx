import type { ReactElement } from "react";

interface IconProps {
  name: string | null;
  size?: number;
}

const paths: Record<string, ReactElement> = {
  crown: (
    <path d="M3 18h18v2H3v-2zm0-11 4.5 4L12 4l4.5 7L21 7v9H3V7z" />
  ),
  globe: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.4 9h-3.1a15.6 15.6 0 0 0-1.5-6.2A8 8 0 0 1 19.4 11zM12 4.1c.9 1.2 2 3.6 2.3 6.9H9.7c.3-3.3 1.4-5.7 2.3-6.9zM4.6 13h3.1c.2 2.4.7 4.5 1.5 6.2A8 8 0 0 1 4.6 13zm3.1-2H4.6a8 8 0 0 1 4.6-6.2A15.6 15.6 0 0 0 7.7 11zm4.3 8.9c-.9-1.2-2-3.6-2.3-6.9h4.6c-.3 3.3-1.4 5.7-2.3 6.9zm2.8-.7c.8-1.7 1.3-3.8 1.5-6.2h3.1a8 8 0 0 1-4.6 6.2z" />
  ),
  trophy: (
    <path d="M6 2h12v2h4v3a5 5 0 0 1-5 5h-.4A6 6 0 0 1 13 15.9V18h3v2H8v-2h3v-2.1A6 6 0 0 1 7.4 12H7a5 5 0 0 1-5-5V4h4V2zm14 4h-2v4a3 3 0 0 0 2-2.8V6zM4 6v1.2A3 3 0 0 0 6 10V6H4z" />
  ),
  exchange: (
    <path d="M7 4l-5 5 5 5v-3h9V8H7V4zm10 16 5-5-5-5v3H8v3h9v4z" />
  ),
  film: (
    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v2h2V5H5zm4 0v6h6V5H9zm8 0v2h2V5h-2zM5 9v2h2V9H5zm12 0v2h2V9h-2zM5 13v2h2v-2H5zm4 0v6h6v-6H9zm8 0v2h2v-2h-2zM5 17v2h2v-2H5zm12 0v2h2v-2h-2z" />
  ),
  building: (
    <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4h5a1 1 0 0 1 1 1v11h2v2H2v-2h2zm2-15v2h2V6H6zm4 0v2h2V6h-2zM6 10v2h2v-2H6zm4 0v2h2v-2h-2zm6 1v2h2v-2h-2zM6 14v2h2v-2H6zm4 0v2h2v-2h-2zm6 1v2h2v-2h-2zM6 18v3h2v-3H6zm4 0v3h2v-3h-2z" />
  ),
  moreless: <path d="M12 2 5.2 9.2h13.6L12 2zm0 20 6.8-7.2H5.2L12 22z" />,
  guessr: (
    <path
      fillRule="evenodd"
      d="M7 2h13v2.5H7V2zm-2 3.5h13V8H5V5.5zM3 9h18v13H3V9zm9 2.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"
    />
  ),
  moneyle: (
    <>
      <path fillRule="evenodd" d="M2 5h20v14H2V5zm2 2v10h16V7H4z" />
      <path d="M12.1 8.15c1.5 0 2.55.95 2.55 2.25 0 .95-.5 1.55-1.4 2.05-.55.3-.75.5-.75.95v.3h-1.85v-.45c0-1.05.45-1.7 1.4-2.2.55-.3.8-.55.8-.95 0-.5-.4-.85-1-.85s-1.05.35-1.15 1.05H9.05c.15-1.5 1.35-2.15 3.05-2.15zM11.15 16.1h1.8v1.8h-1.8v-1.8z" />
    </>
  ),
  connections: (
    <path d="M2 2h9v9H2V2zm11 0h9v9h-9V2zM2 13h9v9H2v-9zm11 0h9v9h-9v-9z" />
  ),
};

export default function Icon({ name, size = 28 }: IconProps) {
  const path = (name && paths[name]) || (
    <path d="M11 17h2v-1.2c1.8-.4 3-1.6 3-3.3 0-2-1.6-2.8-3.4-3.4C11 8.6 10.5 8.2 10.5 7.5c0-.8.7-1.3 1.7-1.3s1.6.5 1.7 1.3h2.2c-.1-1.6-1.2-2.8-3.1-3.2V3h-2v1.3C9.3 4.7 8.2 5.9 8.2 7.5c0 1.9 1.5 2.8 3.3 3.3 1.7.5 2.3 1 2.3 1.8 0 .9-.8 1.4-1.9 1.4-1.2 0-1.9-.6-2-1.5H7.6c.1 1.8 1.3 3 3.4 3.4V17z" />
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
