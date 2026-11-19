import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import { ShopProvider } from "./context/ShopContext";
import Checkout from "./pages/Checkout";
import {BrowserRouter, Routes, Route, Navigate,useLocation} from "react-router-dom";
import Category from "./pages/Category";
import FAQPage from "./pages/FAQPage";
import ProductDetails from "./pages/ProductDetails";
import VendorDetails from "./pages/VendorDetails";
import Wishlist from "./pages/Wishlist";
import AboutUs from "./pages/AboutUs";
import Payment from "./pages/Payment";
import Careers from "./pages/Careers"
import Seller from "./pages/Seller";
// import BankTransfer from "./pages/Banktransfer";
import { useShop } from "./context/ShopContext";
import "./App.css";


function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (
      pathname.startsWith("/account/") ||
      pathname === "/account"
    ) {
      return;
    }
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));

      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
        });
      }, 50);

      return () => window.clearTimeout(timer);
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}


function Layout() {
  const { cartTotal } = useShop();

  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/account" element={<Account />} />
        <Route path="/account/:section" element={<Account />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/payment" element={<Payment amount={cartTotal} />} />
        <Route path="/checkout/payment/add" element={<Payment />} />
        {/* <Route path="/checkout/bank-transfer" element={<BankTransfer />} /> */}

        <Route path="/categories" element={<Category />} />
        <Route path="/categories/:categorySlug" element={<Category />} />
        <Route path="/categories/:categorySlug/:subcategorySlug" element={<Category />} />

        <Route path="/faq" element={<FAQPage />} />
        <Route path="/career" element={<Careers />} />
        <Route path="/sell" element={<Seller />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/vendor/:vendorId" element={<VendorDetails />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <Layout />
      </ShopProvider>
    </BrowserRouter>
  );
}

export default App;