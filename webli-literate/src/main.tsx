import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Purchases from './pages/Purchases';
import OrderSuccess from './pages/OrderSuccess';
import { Policy, Contact } from './pages/Info';
import AdminLayout, { AdminGuard } from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import { BookList, BookForm } from './pages/admin/AdminBooks';
import AdminOrders from './pages/admin/AdminOrders';
import { Categories, Settings } from './pages/admin/AdminMisc';

const P = ({ c }: { c: React.ReactNode }) => <AuthGuard><Layout>{c}</Layout></AuthGuard>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<P c={<Home />} />} />
      <Route path="/books" element={<P c={<Books />} />} />
      <Route path="/books/:id" element={<P c={<BookDetail />} />} />
      <Route path="/cart" element={<P c={<Cart />} />} />
      <Route path="/purchases" element={<P c={<Purchases />} />} />
      <Route path="/order/:reference" element={<P c={<OrderSuccess />} />} />
      <Route path="/contact" element={<P c={<Contact />} />} />
      <Route path="/policy/:key" element={<P c={<Policy />} />} />
      <Route path="/admin" element={<AuthGuard><AdminGuard><AdminLayout /></AdminGuard></AuthGuard>}>
        <Route index element={<Dashboard />} />
        <Route path="books" element={<BookList />} />
        <Route path="books/:id" element={<BookForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
