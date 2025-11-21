import { ToastProvider } from "../contexts/ToastContext.tsx";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default Layout;
