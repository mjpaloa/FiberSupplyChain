import React, { useState, useEffect } from 'react';
import { Leaf, Users, CheckCircle, Phone, Mail, Facebook, MapPin, ShieldCheck, TrendingUp, Award, Menu, X, Quote, ArrowRight, Zap } from 'lucide-react';
import { getCookiePreferences, saveCookiePreferences, hasConsent, trackPageView } from '../utils/cookieManager';

// Types
interface Buyer {
  name: string;
  location: string;
  phone: string;
  description: string;
}

interface Farmer {
  id: number;
  name: string;
  role: string;
  quote: string;
  image: string;
}

interface MAOStaff {
  id: number;
  name: string;
  position: string;
  image: string;
}

type UserRole = 'farmer' | 'buyer' | 'officer' | 'cusafa';

interface HomePageProps {
  onLoginClick: (role: UserRole) => void;
}

// Data
const buyers: Buyer[] = [
  {
    name: "Nonoy Abaca Trading",
    location: "Barangay Culiram, Talacogon",
    phone: "+63 912 345 6789",
    description: "Accepts Grade T1–T3 fiber, with scheduled pick-up and payment options."
  }
];

const abacaQualities = [
  {
    id: 1,
    name: "Grade T1",
    description: "Premium quality abaca fiber with excellent strength and luster",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Grade T2",
    description: "High-quality abaca fiber suitable for various applications",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Grade T3",
    description: "Standard quality abaca fiber for general use",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop"
  }
];

const farmers: Farmer[] = [
  {
    id: 1,
    name: "Maria L.",
    role: "Abaca Farmer - Culiram",
    quote: "Through MAO's training, I learned how to improve fiber quality. Now I sell directly to verified buyers with fair prices.",
    image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Juan P.",
    role: "Abaca Farmer - Culiram",
    quote: "The digital system helped me track my harvest and connect with buyers easily. My income has increased significantly.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Ana R.",
    role: "Abaca Farmer - Culiram",
    quote: "I've been farming abaca for 20 years, but the MAO training transformed my approach. Quality matters more than quantity now.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
  }
];

const maoStaff: MAOStaff[] = [
  {
    id: 1,
    name: "Carlos Mendoza",
    position: "Agriculture Officer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Elena Suarez",
    position: "Program Coordinator",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Roberto Garcia",
    position: "Field Technician",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
  }
];

interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: "Abaca Fiber: The Sustainable Choice for Modern Industries",
    excerpt: "Discover how abaca fiber is revolutionizing eco-friendly manufacturing and why it's becoming the material of choice for sustainable products.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=400&fit=crop",
    date: "October 28, 2024",
    category: "Sustainability"
  },
  {
    id: 2,
    title: "MAO Culiram's Training Program Boosts Farmer Income by 40%",
    excerpt: "Local farmers share their success stories after completing the comprehensive abaca cultivation and quality improvement training program.",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop",
    date: "October 25, 2024",
    category: "Success Stories"
  },
  {
    id: 3,
    title: "Understanding Abaca Fiber Grades: A Complete Guide",
    excerpt: "Learn about the different grades of abaca fiber, from T1 to T3, and how quality standards impact market value and buyer preferences.",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop",
    date: "October 20, 2024",
    category: "Education"
  }
];

const HomePage: React.FC<HomePageProps> = ({ onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentFarmerIndex, setCurrentFarmerIndex] = useState(0);
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Cookie preferences state
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, cannot be disabled
    functional: false,
    analytics: false
  });

  // Scroll animation observer
  useEffect(() => {
    const handleScroll = () => {
      // Scroll tracking for animations
    };
    window.addEventListener('scroll', handleScroll);
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFarmerIndex((prevIndex) => (prevIndex + 1) % farmers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Check if user has accepted cookies and load preferences
  useEffect(() => {
    if (hasConsent()) {
      setShowCookieBanner(false);
      const preferences = getCookiePreferences();
      setCookiePreferences(preferences);
      
      // Track page view if analytics enabled
      if (preferences.analytics) {
        trackPageView('HomePage');
      }
    }
  }, []);

  const acceptAllCookies = () => {
    const preferences = {
      essential: true,
      functional: true,
      analytics: true
    };
    saveCookiePreferences(preferences);
    setCookiePreferences(preferences);
    setShowCookieBanner(false);
    trackPageView('HomePage');
  };

  const acceptEssentialCookies = () => {
    const preferences = {
      essential: true,
      functional: false,
      analytics: false
    };
    saveCookiePreferences(preferences);
    setCookiePreferences(preferences);
    setShowCookieBanner(false);
  };
  
  const saveCustomCookiePreferences = (preferences: typeof cookiePreferences) => {
    saveCookiePreferences(preferences);
    setCookiePreferences(preferences);
    
    if (preferences.analytics) {
      trackPageView('HomePage');
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .scroll-animate {
          opacity: 0;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-white">
        {/* Modern Navigation Bar - Edge to Edge */}
        <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-gray-100">
        <div className="w-full px-6 md:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo and Title - Far Left */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Leaf className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                    E.A.S.Y ABACA
                </h1>
              </div>
            </div>

            {/* Desktop Login Buttons - Far Right */}
            <div className="hidden md:flex items-center space-x-3">
              <button onClick={() => onLoginClick('buyer')} className="px-5 py-2.5 bg-white text-teal-700 border-2 border-teal-500 rounded-lg hover:bg-teal-50 transition-all font-semibold text-sm">
                Buyer Login
              </button>
              <button onClick={() => onLoginClick('farmer')} className="px-5 py-2.5 bg-white text-teal-700 border-2 border-teal-500 rounded-lg hover:bg-teal-50 transition-all font-semibold text-sm">
                Farmer Login
              </button>
              <button onClick={() => onLoginClick('cusafa')} className="px-5 py-2.5 bg-white text-teal-700 border-2 border-teal-500 rounded-lg hover:bg-teal-50 transition-all font-semibold text-sm">
                CUSAFA Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-emerald-600" />
              ) : (
                <Menu className="w-6 h-6 text-emerald-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 animate-in slide-in-from-top duration-200">
              <button onClick={() => onLoginClick('buyer')} className="w-full px-4 py-3 bg-white text-teal-700 border-2 border-teal-500 rounded-xl hover:bg-teal-50 transition-all font-medium">
                Buyer Login
              </button>
              <button onClick={() => onLoginClick('farmer')} className="w-full px-4 py-3 bg-white text-teal-700 border-2 border-teal-500 rounded-xl hover:bg-teal-50 transition-all font-medium">
                Farmer Login
              </button>
              <button onClick={() => onLoginClick('cusafa')} className="w-full px-4 py-3 bg-white text-teal-700 border-2 border-teal-500 rounded-xl hover:bg-teal-50 transition-all font-medium">
                CUSAFA Login
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with YouTube Video Background */}
      <section className="relative pt-16 md:pt-20 overflow-hidden">
        <div className="relative min-h-screen flex items-center">
          {/* YouTube Video Background - Muted */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <iframe
              className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
              src="https://www.youtube.com/embed/Gak_uMCL4qo?autoplay=1&mute=1&loop=1&playlist=Gak_uMCL4qo&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
              title="Abaca Background Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ pointerEvents: 'none' }}
            ></iframe>
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/85 to-emerald-800/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Hero Content - Far Left Edge - Centered Vertically */}
          <div className="relative z-10 w-full h-full flex items-center">
            <div className="w-full pl-8 sm:pl-12 md:pl-16 lg:pl-20 xl:pl-24">
              <div className="max-w-2xl">
                {/* Text Content - Far Left */}
                <div className="text-white space-y-6">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1]">
                    <span className="block text-white drop-shadow-2xl">Empowering</span>
                    <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-2xl">
                      Abaca Farmers
                    </span>
                    <span className="block text-white drop-shadow-2xl">in Culiram</span>
                  </h1>
                  
                  <p className="text-lg md:text-xl lg:text-2xl text-emerald-50 leading-relaxed drop-shadow-lg max-w-xl">
                    A next-generation digital platform connecting farmers, verified buyers, and the Municipal Agriculture Office
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={() => onLoginClick('farmer')}
                      className="group px-8 py-4 bg-white text-emerald-900 rounded-lg hover:bg-emerald-50 transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-2xl hover:shadow-emerald-500/50 hover:scale-105"
                    >
                      <span>Contact MAO</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="group px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/50 text-white rounded-lg hover:bg-white/20 hover:border-white transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-xl hover:scale-105">
                      <Award className="w-5 h-5" />
                      <span>See How It Works</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
            <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm bg-white/10">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Abaca Quality Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Quality Standards
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Abaca Fiber <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Quality Grades</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the different quality grades of abaca fiber produced by our local farmers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {abacaQualities.map((quality, index) => (
              <div key={quality.id} className="scroll-animate group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-gray-100 hover:border-emerald-400" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{quality.id}</span>
                  </div>
                </div>
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={quality.image} 
                    alt={quality.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">{quality.name}</h4>
                  <p className="text-gray-600 leading-relaxed">{quality.description}</p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="text-emerald-600 font-semibold flex items-center group-hover:gap-2 transition-all">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Design */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Empowering <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Abaca Farmers</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A local initiative that strengthens the abaca fiber industry through improved communication, fair transactions, and sustainable livelihood support
            </p>
          </div>

          {/* Features Grid - Modern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="scroll-animate group relative bg-gradient-to-br from-emerald-50 to-white p-8 rounded-3xl border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400 rounded-bl-3xl opacity-10"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Transparent Pricing</h4>
              <p className="text-gray-600 leading-relaxed">Fair trade verification and real-time market updates for better income</p>
            </div>

            <div className="scroll-animate group relative bg-gradient-to-br from-teal-50 to-white p-8 rounded-3xl border-2 border-teal-100 hover:border-teal-400 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3" style={{ animationDelay: '0.1s' }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-400 rounded-bl-3xl opacity-10"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Sustainable Farming</h4>
              <p className="text-gray-600 leading-relaxed">Community-based practices for long-term environmental growth</p>
            </div>

            <div className="scroll-animate group relative bg-gradient-to-br from-emerald-50 to-white p-8 rounded-3xl border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3" style={{ animationDelay: '0.2s' }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400 rounded-bl-3xl opacity-10"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Digital Monitoring</h4>
              <p className="text-gray-600 leading-relaxed">Track all activities and transactions digitally in real-time</p>
            </div>

            <div className="scroll-animate group relative bg-gradient-to-br from-teal-50 to-white p-8 rounded-3xl border-2 border-teal-100 hover:border-teal-400 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3" style={{ animationDelay: '0.3s' }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-400 rounded-bl-3xl opacity-10"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">MAO Coordination</h4>
              <p className="text-gray-600 leading-relaxed">Direct support from the Municipal Agriculture Office</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Buyers Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 scroll-animate">
            <div className="inline-flex items-center space-x-2 bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-md border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              <span>MAO Verified</span>
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Registered & <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Verified Buyers</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              All buyers are verified by MAO Culiram to ensure legitimacy and compliance with local trading guidelines
            </p>
          </div>

          {/* Buyer Cards with Large Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {buyers.map((buyer, index) => (
              <div key={index} className="scroll-animate group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-emerald-400 overflow-hidden flex flex-col h-full hover:-translate-y-2" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Large Buyer Photo */}
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&h=400&fit=crop" 
                    alt={buyer.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                {/* Buyer Information */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-xl font-bold text-emerald-800">{buyer.name}</h4>
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4 flex-grow">
                    <div className="flex items-start text-gray-700">
                      <MapPin className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-emerald-600" />
                      <span className="text-sm">{buyer.location}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600" />
                      <span className="text-sm">{buyer.phone}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed flex-grow">{buyer.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                    <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm flex items-center">
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 mr-2" />
              <span>View All Verified Buyers</span>
            </button>
          </div>
        </div>
      </section>

      {/* MAO Staff Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Our Team
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Meet the <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">MAO Culiram</span> Team
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dedicated professionals working to support our local abaca farmers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {maoStaff.map((staff, index) => (
              <div key={staff.id} className="scroll-animate group bg-gradient-to-br from-gray-50 to-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-emerald-400 hover:-translate-y-2" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={staff.image} 
                    alt={staff.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h4 className="text-xl font-bold text-emerald-800 mb-1">{staff.name}</h4>
                  <p className="text-emerald-600 font-medium">{staff.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Farmers Testimonial */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Success Stories
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Our Local <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Farmers</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The heart of abaca — hardworking farmers from Culiram bringing pride to Talacogon
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-200">
              <div className="flex flex-col lg:flex-row">
                {/* Large Farmer Photo - Left Side */}
                <div className="lg:w-2/5 relative overflow-hidden">
                  <div className="aspect-square lg:aspect-auto lg:h-full">
                    <img 
                      src={farmers[currentFarmerIndex].image} 
                      alt={farmers[currentFarmerIndex].name} 
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h4 className="text-2xl font-bold text-white">{farmers[currentFarmerIndex].name}</h4>
                    <p className="text-emerald-200 font-medium">{farmers[currentFarmerIndex].role}</p>
                  </div>
                </div>
                
                {/* Farmer Testimonial - Right Side */}
                <div className="lg:w-3/5 p-8 md:p-12 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                        <Quote className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="text-2xl font-bold text-emerald-800">Farmer's Story</h4>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute top-0 left-0 text-6xl text-emerald-100 font-serif leading-none">"</div>
                      <p className="text-gray-700 text-lg md:text-xl leading-relaxed pl-8 pt-4">
                        {farmers[currentFarmerIndex].quote}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation Dots */}
                  <div className="flex justify-center mt-8 space-x-2">
                    {farmers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFarmerIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentFarmerIndex ? 'bg-emerald-500 w-8' : 'bg-emerald-200'
                        }`}
                        aria-label={`View farmer ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-8 pt-6 border-t border-emerald-100">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                        <span className="text-gray-600">Verified Farmer</span>
                      </div>
                      <div className="flex items-center">
                        <Leaf className="w-5 h-5 text-emerald-500 mr-2" />
                        <span className="text-gray-600">Sustainable Practices</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Latest Updates
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Articles & <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">News</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with the latest insights, success stories, and educational content about abaca farming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <div key={article.id} className="scroll-animate group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-emerald-400 hover:-translate-y-2" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">{article.date}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{article.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm flex items-center group"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 md:h-80">
              <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  {selectedArticle.category}
                </span>
                <span className="text-sm text-gray-500">{selectedArticle.date}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedArticle.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{selectedArticle.excerpt}</p>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  This is a detailed article about {selectedArticle.title.toLowerCase()}. The content provides comprehensive information about the topic, including insights from local farmers, MAO officials, and industry experts.
                </p>
                <p className="mb-4">
                  The abaca industry in Culiram continues to grow thanks to the dedicated efforts of our local farmers and the support from the Municipal Agriculture Office. Through proper training, quality control, and fair trade practices, we're building a sustainable future for our community.
                </p>
                <p>
                  For more information or to get involved in the abaca farming program, please contact the MAO Culiram office or visit our facility in Barangay Culiram, Talacogon.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Terms of Service</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="p-8 prose max-w-none">
              <p className="text-sm text-gray-500 mb-6">Last Updated: November 1, 2024</p>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-700 mb-4">
                By accessing and using the MAO Culiram Abaca System, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">2. User Accounts</h3>
              <p className="text-gray-700 mb-4">
                Users must register as either a Farmer, Buyer, or MAO Officer. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">3. Acceptable Use</h3>
              <p className="text-gray-700 mb-4">
                You agree to use the platform only for lawful purposes and in accordance with these Terms. You agree not to use the platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>In any way that violates any applicable national or local law or regulation</li>
                <li>To transmit any unauthorized or unsolicited advertising or promotional material</li>
                <li>To impersonate or attempt to impersonate the MAO, another user, or any other person or entity</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-800 mb-3">4. Transactions</h3>
              <p className="text-gray-700 mb-4">
                All transactions between farmers and buyers must be conducted in accordance with local regulations and MAO guidelines. The platform facilitates connections but does not guarantee transactions.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">5. Data Accuracy</h3>
              <p className="text-gray-700 mb-4">
                Users are responsible for ensuring that all information provided is accurate and up-to-date. The MAO reserves the right to verify information and suspend accounts with false information.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">6. Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                The MAO Culiram Abaca System is provided "as is" without any warranties. We shall not be liable for any damages arising from the use of this platform.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">7. Changes to Terms</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">8. Contact Information</h3>
              <p className="text-gray-700">
                For questions about these Terms, please contact us at mao.culiram@talacogon.gov.ph or call (085) 123-4567.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Management Modal */}
      {showCookieModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCookieModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Manage Cookies</h2>
              <button 
                onClick={() => setShowCookieModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="p-8 prose max-w-none">
              <p className="text-sm text-gray-500 mb-6">Last Updated: November 5, 2024</p>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">About Cookies</h3>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">Types of Cookies We Use</h3>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-4">
                <h4 className="text-lg font-bold text-emerald-800 mb-2">Essential Cookies (Required)</h4>
                <p className="text-gray-700 mb-3">
                  These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Authentication and login status</li>
                  <li>Security and fraud prevention</li>
                  <li>Session management</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
                <h4 className="text-lg font-bold text-blue-800 mb-2">Functional Cookies (Optional)</h4>
                <p className="text-gray-700 mb-3">
                  These cookies allow us to remember your preferences and provide enhanced features.
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Language preferences</li>
                  <li>Display settings</li>
                  <li>User interface customization</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-4">
                <h4 className="text-lg font-bold text-purple-800 mb-2">Analytics Cookies (Optional)</h4>
                <p className="text-gray-700 mb-3">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Page visit statistics</li>
                  <li>User behavior analysis</li>
                  <li>Performance monitoring</li>
                </ul>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-3">Managing Your Cookie Preferences</h3>
              <p className="text-gray-700 mb-4">
                You can control and manage cookies in various ways. Please note that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Customize Cookie Settings</h4>
                <p className="text-sm text-gray-600 mb-4">Toggle individual cookie categories to customize your experience and optimize performance.</p>
                <div className="space-y-3">
                  {/* Essential Cookies - Always On */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-emerald-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <p className="font-semibold text-gray-800">Essential Cookies</p>
                      </div>
                      <p className="text-sm text-gray-600">Always active - Required for website functionality</p>
                    </div>
                    <div className="ml-4">
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                        Always On
                      </div>
                    </div>
                  </div>
                  
                  {/* Functional Cookies - Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-gray-800">Functional Cookies</p>
                      </div>
                      <p className="text-sm text-gray-600">Remembers your preferences and settings</p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          const newPrefs = { ...cookiePreferences, functional: !cookiePreferences.functional };
                          setCookiePreferences(newPrefs);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          cookiePreferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            cookiePreferences.functional ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Analytics Cookies - Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <p className="font-semibold text-gray-800">Analytics Cookies</p>
                      </div>
                      <p className="text-sm text-gray-600">Helps us improve performance and reduce traffic</p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          const newPrefs = { ...cookiePreferences, analytics: !cookiePreferences.analytics };
                          setCookiePreferences(newPrefs);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          cookiePreferences.analytics ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            cookiePreferences.analytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Performance Impact Notice */}
                {cookiePreferences.analytics && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Performance Optimization Enabled</p>
                        <p className="text-xs text-emerald-700 mt-1">Analytics cookies help us optimize the system and reduce server traffic by caching your preferences and monitoring performance.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => {
                    acceptEssentialCookies();
                    setShowCookieModal(false);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Essential Only
                </button>
                <button
                  onClick={() => {
                    saveCustomCookiePreferences(cookiePreferences);
                    setShowCookieModal(false);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => {
                    acceptAllCookies();
                    setShowCookieModal(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Accept All
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">Performance Benefits</h3>
              <p className="text-gray-700 mb-4">
                Enabling analytics cookies helps us optimize the system by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Caching frequently accessed data to reduce server load</li>
                <li>Identifying and fixing performance bottlenecks</li>
                <li>Optimizing page load times and reducing traffic</li>
                <li>Improving overall user experience</li>
              </ul>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">Browser Cookie Settings</h3>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can typically find these settings in the "Options" or "Preferences" menu of your browser.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">Contact Us</h3>
              <p className="text-gray-700">
                If you have any questions about our use of cookies, please contact us at:<br />
                Email: mao.culiram@talacogon.gov.ph<br />
                Phone: (085) 123-4567
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="p-8 prose max-w-none">
              <p className="text-sm text-gray-500 mb-6">Last Updated: November 1, 2024</p>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h3>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Profile information (address, association details, farming information)</li>
                <li>Transaction and activity data on the platform</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h3>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative information and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues and fraudulent activities</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-800 mb-3">3. Information Sharing</h3>
              <p className="text-gray-700 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Other users (farmers, buyers, MAO officers) as necessary for platform functionality</li>
                <li>Government agencies as required by law or regulation</li>
                <li>Service providers who assist in operating our platform</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-800 mb-3">4. Data Security</h3>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">5. Data Retention</h3>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">6. Your Rights</h3>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-800 mb-3">7. Cookies</h3>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">8. Children's Privacy</h3>
              <p className="text-gray-700 mb-4">
                Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">9. Changes to Privacy Policy</h3>
              <p className="text-gray-700 mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">10. Contact Us</h3>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:<br />
                Email: mao.culiram@talacogon.gov.ph<br />
                Phone: (085) 123-4567<br />
                Address: Barangay Culiram, Talacogon, Agusan del Sur
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 max-w-md animate-in slide-in-from-bottom duration-300">
          <div className="p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-bold text-gray-900">Cookie Preferences</h3>
                <p className="mt-2 text-sm text-gray-600">
                  We use cookies to improve your experience, analyze traffic, and for marketing purposes. 
                  You can choose which cookies to accept or reject.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptEssentialCookies}
                className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={acceptAllCookies}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Accept All
              </button>
            </div>
            <div className="mt-3 text-center">
              <button 
                onClick={() => setShowCookieModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium underline"
              >
                Manage preferences & Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-emerald-900 to-teal-900 text-emerald-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Left Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">MAO Culiram</h4>
                  <p className="text-sm text-emerald-300">Abaca System</p>
                </div>
              </div>
              <p className="text-sm text-emerald-200 mb-2">Powered by the Municipal Agriculture Office</p>
              <p className="text-sm text-emerald-200">Barangay Culiram, Talacogon, Agusan del Sur</p>
            </div>

            {/* Middle Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-emerald-200 hover:text-white transition flex items-center space-x-2">
                  <span>🌿</span><span>Home</span>
                </a></li>
                <li><a href="#" className="text-emerald-200 hover:text-white transition flex items-center space-x-2">
                  <span>🧾</span><span>Buyers List</span>
                </a></li>
                <li><a href="#" className="text-emerald-200 hover:text-white transition flex items-center space-x-2">
                  <span>📩</span><span>Contact MAO</span>
                </a></li>
              </ul>
            </div>

            {/* Right Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:0851234567" className="flex items-center space-x-3 text-emerald-200 hover:text-white transition">
                  <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>(085) 123-4567</span>
                </a>
                <a href="mailto:mao.culiram@talacogon.gov.ph" className="flex items-center space-x-3 text-emerald-200 hover:text-white transition">
                  <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>mao.culiram@talacogon.gov.ph</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-emerald-200 hover:text-white transition">
                  <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <span>MAOCuliramOfficial</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-emerald-300">© 2025 MAO Culiram Abaca System. All Rights Reserved.</p>
              <div className="flex items-center gap-4 text-sm">
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-emerald-200 hover:text-white transition underline"
                >
                  Terms of Service
                </button>
                <span className="text-emerald-600">|</span>
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-emerald-200 hover:text-white transition underline"
                >
                  Privacy Policy
                </button>
                <span className="text-emerald-600">|</span>
                <button 
                  onClick={() => setShowCookieModal(true)}
                  className="text-emerald-200 hover:text-white transition underline"
                >
                  Manage Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default HomePage;