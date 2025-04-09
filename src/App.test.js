import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading profiles message', () => {
  render(<App />);
  const loadingElement = screen.getByText(/loading profiles/i);
  expect(loadingElement).toBeInTheDocument();
});
