import React, { useState, useEffect } from 'react';
import { Leaf, Users, CheckCircle, Phone, Mail, Facebook, MapPin, ShieldCheck, TrendingUp, Award, Menu, X, Quote, ArrowRight, Zap, User, DollarSign, Search, Filter, Truck, Activity, FileText, Users as UsersIcon } from 'lucide-react';
import { getCookiePreferences, saveCookiePreferences, hasConsent, trackPageView } from '../utils/cookieManager';
import { QualityModal, BuyerDetailsModal } from './HomePageModals';

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
    location: "Prk 4 San Pedro, Prosperidad, Agusan Del Sur",
    phone: "09855744095",
    description: "Accepts Class A, B, and C fiber. Buying schedule: Monday - Sunday. Cash on delivery only."
  }
];

const abacaQualities = [
  {
    id: 1,
    name: "Class A",
    grade: "Premium Quality",
    fullConcept: "Class A represents the pinnacle of abaca fiber excellence. Also known as Manila hemp, this premium grade fiber is extracted from the leaf sheaths of Musa textilis, a species of banana native to the Philippines. Class A fibers are meticulously processed to preserve their natural strength, flexibility, and lustrous appearance, making them highly sought after in international markets for specialized applications.",
    description: "Highest quality abaca fiber with superior strength, fine texture, and excellent luster. Ideal for premium products and high-value applications.",
    fiberProperties: "Tensile strength: 980-1,100 MPa | Fiber length: 2.5-3.5 meters | Diameter: 17-21 microns | Moisture content: 10-14% | Natural color: White to light cream | pH level: 6.5-7.5 | Cellulose content: 60-65%",
    characteristics: "Clean, uniform color, long fiber length, minimal impurities, strong and flexible",
    qualityIndicators: "Visual inspection shows consistent ivory-white coloration with natural sheen. Fibers are straight, smooth, and free from knots or weak points. Hand feel is silky with excellent drape. Breaking strength exceeds 400 kg/cm². Resistant to saltwater degradation. Low lignin content ensures superior dyeability.",
    harvestingProcess: "Harvested from mature plants (18-24 months old) during dry season. Outer sheaths carefully stripped using traditional 'tuxying' method. Immediate processing within 24 hours to prevent discoloration. Hand-scraped using ceramic or wood tools to preserve fiber integrity. Sun-dried for 2-3 days, achieving 12% moisture content. Sorted and bundled by experienced graders.",
    applications: "High-end textiles, specialty papers, marine cordage, premium handicrafts",
    marketValue: "Class A commands premium prices in global markets, typically 150-200% higher than standard grades. High demand from Japanese paper mills, European textile manufacturers, and specialty marine rope producers. Export quality with international certifications. Preferred for banknote paper, tea bags, and high-performance marine applications.",
    image: "/assets/types/ClassA.jpg"
  },
  {
    id: 2,
    name: "Class B",
    grade: "Standard Quality",
    fullConcept: "Class B abaca fiber represents the backbone of commercial abaca production, offering an excellent balance between quality and cost-effectiveness. This grade maintains the inherent strength and durability of abaca while being more accessible for general industrial applications. Class B fibers are versatile and reliable, serving as the workhorse of the textile, paper, and cordage industries worldwide.",
    description: "Good quality abaca fiber suitable for various commercial applications. Balanced strength and appearance for general use.",
    fiberProperties: "Tensile strength: 750-900 MPa | Fiber length: 2.0-2.8 meters | Diameter: 20-28 microns | Moisture content: 12-16% | Natural color: Light cream to beige | pH level: 6.0-7.0 | Cellulose content: 55-62%",
    characteristics: "Good color consistency, moderate fiber length, few impurities, durable and reliable",
    qualityIndicators: "Shows consistent light cream coloration with minimal color variation. Fibers are relatively straight with occasional minor imperfections. Good tensile strength of 250-350 kg/cm². Adequate resistance to environmental factors. Moderate flexibility suitable for most weaving and braiding applications.",
    harvestingProcess: "Harvested from plants aged 15-20 months. Can be processed during both dry and wet seasons with proper handling. Outer to middle sheaths utilized. Machine-assisted stripping acceptable with quality control. Processed within 48 hours of harvest. Mechanical or semi-mechanical scraping methods employed. Air-dried or low-heat dried to 14% moisture content.",
    applications: "General textiles, paper products, ropes, bags, and accessories",
    marketValue: "Class B offers excellent value proposition for commercial buyers. Prices typically 30-50% lower than Class A while maintaining good performance characteristics. Strong demand from furniture industry, packaging sector, and general cordage manufacturers. Suitable for both domestic and export markets. Popular for automotive interior components and construction materials.",
    image: "/assets/types/ClassB.jpg"
  },
  {
    id: 3,
    name: "Class C",
    grade: "Basic Quality",
    fullConcept: "Class C abaca fiber serves essential roles in everyday applications where functional strength is more important than aesthetic perfection. This economical grade makes abaca's natural durability and sustainability accessible to wider markets and applications. Class C represents efficient utilization of the entire abaca plant, supporting sustainable farming practices and maximizing farmer income through comprehensive harvest utilization.",
    description: "Standard quality abaca fiber for basic applications. Cost-effective option for everyday products and general manufacturing.",
    fiberProperties: "Tensile strength: 500-700 MPa | Fiber length: 1.5-2.2 meters | Diameter: 25-35 microns | Moisture content: 14-18% | Natural color: Beige to light brown | pH level: 5.5-6.5 | Cellulose content: 50-58%",
    characteristics: "Acceptable color variation, shorter fiber length, some impurities present, adequate strength",
    qualityIndicators: "Color ranges from beige to light brown with natural variations acceptable. Fibers may show some weathering or minor damage but maintain structural integrity. Breaking strength of 150-250 kg/cm² suitable for general purposes. Good abrasion resistance. Adequate for most utility applications.",
    harvestingProcess: "Harvested from plants 12-18 months old or from inner sheaths of mature plants. Year-round harvesting possible. Includes lower quality outer sheaths and processing waste recovery. Mechanical stripping and processing standard. Processed within 72 hours acceptable. Machine-dried to 16% moisture content. Bulk sorting by weight rather than individual fiber inspection.",
    applications: "Basic ropes, mats, paper products, agricultural twines, and utility items",
    marketValue: "Class C provides cost-effective solutions for volume buyers and basic applications. Priced 50-70% lower than Class A, making it accessible for agricultural and industrial bulk users. Strong local market demand. Used in soil erosion control, agricultural binding, and basic packaging. Growing market in eco-friendly alternatives to synthetic materials. Suitable for pulp production and composite material reinforcement.",
    image: "/assets/types/ClassC.jpg"
  }
];

const farmers: Farmer[] = [
  {
    id: 1,
    name: "Maria L.",
    role: "Abaca Farmer - Culiram",
    quote: "Through MAO's training, I learned how to improve fiber quality. Now I sell directly to verified buyers with fair prices.",
    image: "/assets/farmers/Maria.jpg"
  },
  {
    id: 2,
    name: "Juan P.",
    role: "Abaca Farmer - Culiram",
    quote: "The digital system helped me track my harvest and connect with buyers easily. My income has increased significantly.",
    image: "/assets/farmers/Juan.jpg"
  },
  {
    id: 3,
    name: "Ana R.",
    role: "Abaca Farmer - Culiram",
    quote: "I've been farming abaca for 20 years, but the MAO training transformed my approach. Quality matters more than quantity now.",
    image: "/assets/farmers/Ana.jpg"
  }
];

const maoStaff: MAOStaff[] = [
  {
    id: 1,
    name: "Hanah Faye I. Calunia",
    position: "OIC- Municipal Agriculture",
    image: "/assets/team/team1.jpg"
  },
  {
    id: 2,
    name: "Miriam B. Moreno",
    position: "High Value Coordinator",
    image: "/assets/team/team2.jpg"
  },
  {
    id: 3,
    name: "Pedro C. Andig Jr",
    position: "Program Coordinator",
    image: "/assets/team/team3.jpg"
  },
  {
    id: 4,
    name: "Michael Joshua B. Paloa",
    position: "I.T Staff",
    image: "/assets/team/team4.jpg"
  },
  {
    id: 5,
    name: "Jacob O. Claro",
    position: "I.T Staff",
    image: "/assets/team/team5.jpg"
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
    image: "/assets/articles/AbacaFiber.jpg",
    date: "October 28, 2024",
    category: "Sustainability"
  },
  {
    id: 2,
    title: "MAO Culiram's Training Program Boosts Farmer Income by 40%",
    excerpt: "Local farmers share their success stories after completing the comprehensive abaca cultivation and quality improvement training program.",
    image: "/assets/articles/TrainingProgram.jpg",
    date: "October 25, 2024",
    category: "Success Stories"
  },
  {
    id: 3,
    title: "Understanding Abaca Fiber Grades: A Complete Guide",
    excerpt: "Learn about the different grades of abaca fiber, from T1 to T3, and how quality standards impact market value and buyer preferences.",
    image: "/assets/articles/AbacaGrades.jpg",
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
  const [selectedQuality, setSelectedQuality] = useState<typeof abacaQualities[0] | null>(null);
  const [showBuyerDetails, setShowBuyerDetails] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [howItWorksRole, setHowItWorksRole] = useState<'farmer' | 'buyer' | 'association'>('farmer');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Inquiry from ${contactForm.name}`;
    const body = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`;
    window.location.href = `mailto:mao.culiram@talacogon.gov.ph?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowContactModal(false);
    setContactForm({ name: '', email: '', message: '' });
  };

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
                  Association Login
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
                  Association Login
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
              <div className="w-full px-4 sm:pl-12 md:pl-16 lg:pl-20 xl:pl-24 text-center sm:text-left">
                <div className="max-w-2xl mx-auto sm:mx-0">
                  {/* Text Content - Far Left */}
                  <div className="text-white space-y-6">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1]">
                      <span className="block text-white drop-shadow-2xl">Empowering</span>
                      <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-2xl">
                        Abaca Farmers
                      </span>
                      <span className="block text-white drop-shadow-2xl">in Culiram</span>
                    </h1>

                    <p className="text-lg md:text-xl lg:text-2xl text-emerald-50 leading-relaxed drop-shadow-lg max-w-xl mx-auto sm:mx-0">
                      A next-generation digital platform connecting farmers, verified buyers, association, and the Municipal Agriculture Office
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 items-center sm:items-start w-full sm:w-auto">
                      <button
                        onClick={() => setShowContactModal(true)}
                        className="group w-full sm:w-auto px-8 py-4 bg-white text-emerald-900 rounded-lg hover:bg-emerald-50 transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-2xl hover:shadow-emerald-500/50 hover:scale-105"
                      >
                        <span>Contact MAO</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                        onClick={() => setShowHowItWorksModal(true)}
                        className="group w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/50 text-white rounded-lg hover:bg-white/20 hover:border-white transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-xl hover:scale-105"
                      >
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
                    <h4 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{quality.name}</h4>
                    <p className="text-sm font-semibold text-emerald-600 mb-3">{quality.grade}</p>
                    <p className="text-gray-600 leading-relaxed line-clamp-3">{quality.description}</p>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedQuality(quality)}
                        className="text-emerald-600 font-semibold flex items-center group-hover:gap-2 transition-all"
                      >
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
                      src="/assets/buyers/Nonoy.jpg"
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
                      <button
                        onClick={() => setShowBuyerDetails(true)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-sm flex items-center"
                      >
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
                  <div className="h-[380px] overflow-hidden bg-gray-100">
                    <img
                      src={staff.image}
                      alt={staff.name}
                      className="w-full h-full object-cover object-center scale-110 hover:scale-125 transition-transform duration-500"
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
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentFarmerIndex ? 'bg-emerald-500 w-8' : 'bg-emerald-200'
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cookiePreferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cookiePreferences.functional ? 'translate-x-6' : 'translate-x-1'
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cookiePreferences.analytics ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cookiePreferences.analytics ? 'translate-x-6' : 'translate-x-1'
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
                  Phone: 09532765484
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
                  Phone: 09532765484<br />
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
                  <li><button onClick={() => setShowContactModal(true)} className="text-emerald-200 hover:text-white transition flex items-center space-x-2 w-full text-left">
                    <span>📩</span><span>Contact MAO</span>
                  </button></li>
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
                    <span>09532765484</span>
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

        {/* Quality Details Modal */}
        <QualityModal
          quality={selectedQuality}
          onClose={() => setSelectedQuality(null)}
        />

        {/* Buyer Details Modal */}
        <BuyerDetailsModal
          show={showBuyerDetails}
          onClose={() => setShowBuyerDetails(false)}
        />

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="relative h-32 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="text-center z-10">
                  <h2 className="text-3xl font-bold text-white mb-2">Contact Us</h2>
                  <p className="text-emerald-100">We'd love to hear from you</p>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="your.email@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
                      placeholder="How can we help you?"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Send Message</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Modal */}
        {showHowItWorksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="relative h-40 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="text-center z-10">
                  <h2 className="text-3xl font-bold text-white mb-2">How E.A.S.Y ABACA Works</h2>
                  <p className="text-emerald-100">Simple steps to get started with our platform</p>
                </div>
                <button
                  onClick={() => setShowHowItWorksModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                {/* Role Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                  <button
                    onClick={() => setHowItWorksRole('farmer')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${howItWorksRole === 'farmer' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Farmers
                  </button>
                  <button
                    onClick={() => setHowItWorksRole('buyer')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${howItWorksRole === 'buyer' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Buyers
                  </button>
                  <button
                    onClick={() => setHowItWorksRole('association')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${howItWorksRole === 'association' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Association
                  </button>
                </div>

                {/* Content based on Role */}
                <div className="space-y-8 animate-in slide-in-from-right duration-300" key={howItWorksRole}>
                  {howItWorksRole === 'farmer' && (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">1. Register & Login</h3>
                            <p className="text-gray-600">Create your farmer account and log in to access your dashboard.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Leaf className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">2. Post Your Harvest</h3>
                            <p className="text-gray-600">Share details about your abaca harvest, including quantity and quality (grade).</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">3. Check Prices & Connect</h3>
                            <p className="text-gray-600">View current market prices and connect with verified buyers in the network.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                        <h4 className="font-bold text-emerald-900 mb-4">Farmer Benefits</h4>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>Direct access to buyers</span>
                          </li>
                          <li className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>Fair market price transparency</span>
                          </li>
                          <li className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>Technical support from MAO</span>
                          </li>
                        </ul>
                        <button onClick={() => { setShowHowItWorksModal(false); onLoginClick('farmer'); }} className="mt-6 w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">
                          Start as Farmer
                        </button>
                      </div>
                    </div>
                  )}

                  {howItWorksRole === 'buyer' && (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Search className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">1. Browse Supply</h3>
                            <p className="text-gray-600">Explore available abaca fiber listings from verified local farmers.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Filter className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">2. Filter by Quality</h3>
                            <p className="text-gray-600">Find the specific fiber grades (T1, T2, etc.) you need for your production.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Truck className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">3. Transact Securely</h3>
                            <p className="text-gray-600">Coordinate pickup and payment directly with farmers through the system.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4">Buyer Benefits</h4>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2 text-blue-800">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>Consistent supply chain</span>
                          </li>
                          <li className="flex items-center gap-2 text-blue-800">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>Quality assured produce</span>
                          </li>
                          <li className="flex items-center gap-2 text-blue-800">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>Direct negotiation</span>
                          </li>
                        </ul>
                        <button onClick={() => { setShowHowItWorksModal(false); onLoginClick('buyer'); }} className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                          Start as Buyer
                        </button>
                      </div>
                    </div>
                  )}

                  {howItWorksRole === 'association' && (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <UsersIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">1. Manage Members</h3>
                            <p className="text-gray-600">Verify and oversee farmer and buyer accounts within the system.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">2. Monitor Transactions</h3>
                            <p className="text-gray-600">Track sales volume and market trends in real-time.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">3. Generate Reports</h3>
                            <p className="text-gray-600">Create detailed reports for municipal records and planning.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                        <h4 className="font-bold text-purple-900 mb-4">Association Goals</h4>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2 text-purple-800">
                            <CheckCircle className="w-5 h-5 text-purple-500" />
                            <span>Empower local farmers</span>
                          </li>
                          <li className="flex items-center gap-2 text-purple-800">
                            <CheckCircle className="w-5 h-5 text-purple-500" />
                            <span>Systematic data collection</span>
                          </li>
                          <li className="flex items-center gap-2 text-purple-800">
                            <CheckCircle className="w-5 h-5 text-purple-500" />
                            <span>Community growth</span>
                          </li>
                        </ul>
                        <button onClick={() => { setShowHowItWorksModal(false); onLoginClick('cusafa'); }} className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                          Login as Association
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;