import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as reactRedux from 'react-redux';
import Navbar from './Navbar';
import '@testing-library/jest-dom';

// Mock react-redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));

// Mock react-router-dom's useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Navbar Component - Admin Access', () => {
  const useSelectorMock = reactRedux.useSelector;

  beforeEach(() => {
    useSelectorMock.mockClear();
    mockedNavigate.mockClear();
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  test('affiche le lien "Dashboard Admin" pour un administrateur', () => {
    // Mock state for admin
    useSelectorMock.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isAuthenticated: true,
          user: { role: 'admin', name: 'Admin User' }
        },
        cart: { totalQuantity: 2 }
      };
      return selector(mockState);
    });

    renderNavbar();

    // Le lien doit être présent dans le DOM (même si caché par CSS dans le dropdown)
    const adminLinks = screen.getAllByText(/Dashboard Admin/i);
    expect(adminLinks.length).toBeGreaterThan(0);
  });

  test('affiche le lien "Dashboard Admin" pour un modérateur', () => {
    // Mock state for moderator
    useSelectorMock.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isAuthenticated: true,
          user: { role: 'moderator', name: 'Mod User' }
        },
        cart: { totalQuantity: 0 }
      };
      return selector(mockState);
    });

    renderNavbar();

    const adminLinks = screen.getAllByText(/Dashboard Admin/i);
    expect(adminLinks.length).toBeGreaterThan(0);
  });

  test('n\'affiche PAS le lien "Dashboard Admin" pour un utilisateur standard', () => {
    // Mock state for standard user
    useSelectorMock.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isAuthenticated: true,
          user: { role: 'user', name: 'Standard User' }
        },
        cart: { totalQuantity: 0 }
      };
      return selector(mockState);
    });

    renderNavbar();

    const adminLink = screen.queryByText(/Dashboard Admin/i);
    expect(adminLink).not.toBeInTheDocument();
  });

  test('n\'affiche PAS le lien "Dashboard Admin" pour un visiteur non connecté', () => {
    // Mock state for guest
    useSelectorMock.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isAuthenticated: false,
          user: null
        },
        cart: { totalQuantity: 0 }
      };
      return selector(mockState);
    });

    renderNavbar();

    const adminLink = screen.queryByText(/Dashboard Admin/i);
    expect(adminLink).not.toBeInTheDocument();
  });
});
