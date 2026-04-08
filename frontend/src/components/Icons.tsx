// src/components/Icons.tsx

import React from "react";

const iconProps = ({ className, ...props }: any, defaultClass = "w-5 h-5") => ({
  className: className ?? defaultClass,
  ...props,
});

// -----------------------------------------------------------------------------
// HOME
// -----------------------------------------------------------------------------
export const HomeIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8M5 10v10h14V10"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// USERS
// -----------------------------------------------------------------------------
export const UsersIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// SETTINGS
// -----------------------------------------------------------------------------
export const SettingsIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15a3 3 0 100-6 3 3 0 000 6zm7.94-3a1 1 0 00.06-.33v-.34a8 8 0 00-.9-3.9l.24-.25a1 1 0 000-1.41l-1.42-1.42a1 1 0 00-1.41 0l-.25.24A8 8 0 0015.67 4h-.34a1 1 0 00-.33.06A8 8 0 0011 2.06 1 1 0 0010.67 2H9.33a8 8 0 00-3.9.9l-.25-.24a1 1 0 00-1.41 0L2.34 4.08a1 1 0 000 1.41l.24.25A8 8 0 002.06 9.33v.34A1 1 0 002 10.67a8 8 0 00.94 3.9l-.24.25a1 1 0 000 1.41l1.42 1.42a1 1 0 001.41 0l.25-.24a8 8 0 003.9.9h.34a1 1 0 00.33-.06 8 8 0 003.9.94 1 1 0 00.33-.06h.34a8 8 0 003.9-.9l.25.24a1 1 0 001.41 0l1.42-1.42a1 1 0 000-1.41l-.24-.25a8 8 0 00.9-3.9z"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// PLUS
// -----------------------------------------------------------------------------
export const PlusIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// -----------------------------------------------------------------------------
// SEARCH
// -----------------------------------------------------------------------------
export const SearchIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// LOCK
// -----------------------------------------------------------------------------
export const LockIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// -----------------------------------------------------------------------------
// UNLOCK
// -----------------------------------------------------------------------------
export const UnlockIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 11V7a5 5 0 0110 0"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// TRASH
// -----------------------------------------------------------------------------
export const TrashIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// -----------------------------------------------------------------------------
// EYE
// -----------------------------------------------------------------------------
export const EyeIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// EDIT
// -----------------------------------------------------------------------------
export const EditIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.34 3.27l1.42-1.42a2 2 0 112.83 2.83l-1.42 1.42m-2.83-2.83L4 12v4h4l7.34-7.34m-2.83-2.83l2.83 2.83"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// ARROW LEFT
// -----------------------------------------------------------------------------
export const ArrowLeftIcon = (props: any) => (
  <svg
    {...iconProps(props)}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 19.5L3 12l7.5-7.5M3 12h18"
    />
  </svg>
);
// Hospital Icon
export const HospitalIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 21h18M4 10h16M10 6h4M12 10v11" />
  </svg>
);

// Doctor Icon
export const DoctorIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
);

// File Icon
export const FileIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12h6M9 16h6M5 8h14M4 4h16v16H4z" />
  </svg>
);