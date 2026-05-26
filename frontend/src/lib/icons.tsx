import React from "react";

type P = React.SVGProps<SVGSVGElement>;
const svg = (path: React.ReactNode) => (p: P) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {path}
  </svg>
);

export const I = {
  plus: svg(<><path d="M12 5v14" /><path d="M5 12h14" /></>),
  star: svg(<path d="M12 2l3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4-6.2 3.4 1.2-7-5-4.8 7-.9z" />),
  starFilled: (p: P) => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2l3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4-6.2 3.4 1.2-7-5-4.8 7-.9z" />
    </svg>
  ),
  chevron: svg(<path d="M9 6l6 6-6 6" />),
  pin: svg(<><path d="M12 2v6" /><path d="M8 8h8l-1 6H9z" /><path d="M12 14v8" /></>),
  settings: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  upload: svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>),
  close: svg(<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>),
  more: svg(<><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
};
