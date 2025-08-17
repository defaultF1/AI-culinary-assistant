/// <reference types="react" />

// This declaration file augments the global JSX namespace to inform TypeScript
// about the custom <ion-icon> element, and declares the global `google` variable.

declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string;
    }, HTMLElement>;
  }
}

declare var google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
      renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; type?: string, text?: string, width?: string, logo_alignment?: string }) => void;
      prompt: () => void;
      cancel: () => void;
      disableAutoSelect: () => void;
    };
  };
};
