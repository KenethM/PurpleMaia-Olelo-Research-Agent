import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/hooks/contexts/AuthContext';

// Create a custom render function that includes common providers
interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: Providers, ...options });

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the default render with our custom one
export { customRender as render };