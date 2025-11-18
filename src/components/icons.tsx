import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 2a10 10 0 0 0-10 10" />
      <path d="M12 12a4 4 0 1 1 4-4" />
      <path d="M12 12a4 4 0 0 0-4 4" />
      <path d="M12 12a4 4 0 0 1 4 4" />
      <path d="M12 12a4 4 0 0 0-4-4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M12 2V4" />
      <path d="M12 20v2" />
    </svg>
  );
}
