import React from 'react';
import { X, Award, CheckCircle, Mail, Phone, MapPin, Calendar, CreditCard, Building2, Clock, Sparkles } from 'lucide-react';

interface QualityModalProps {
  quality: {
    id: number;
    name: string;
    grade: string;
    description: string;
    characteristics: string;
    applications: string;
    image: string;
    fullConcept: string;
    fiberProperties: string;
    qualityIndicators: string;
    harvestingProcess: string;
    marketValue: string;
  } | null;
  onClose: () => void;
}

export const QualityModal: React.FC<QualityModalProps> = ({ quality, onClose }) => {
  if (!quality) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative h-64 md:h-80">
          <img 
            src={quality.image} 
            alt={quality.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition shadow-lg"
          >
            <X className="w-6 h-6 text-gray-800" />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-4xl font-bold text-white mb-2">{quality.name}</h2>
            <p className="text-xl font-semibold text-emerald-300">{quality.grade}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10">
          {/* Full Concept */}
          <div className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900">Fiber Concept</h3>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed font-medium">{quality.fullConcept || quality.description}</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <Award className="w-6 h-6 mr-2 text-emerald-600" />
              Overview
            </h3>
            <p className="text-base text-gray-700 leading-relaxed">{quality.description}</p>
          </div>

          {/* Fiber Properties */}
          {quality.fiberProperties && (
            <div className="mb-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-blue-900 mb-3">Fiber Properties</h3>
              <p className="text-gray-700 leading-relaxed">{quality.fiberProperties}</p>
            </div>
          )}

          {/* Characteristics */}
          <div className="mb-6 bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Key Characteristics
            </h3>
            <p className="text-gray-700 leading-relaxed">{quality.characteristics}</p>
          </div>

          {/* Quality Indicators */}
          {quality.qualityIndicators && (
            <div className="mb-6 bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="text-lg font-bold text-purple-900 mb-3">Quality Indicators</h3>
              <p className="text-gray-700 leading-relaxed">{quality.qualityIndicators}</p>
            </div>
          )}

          {/* Harvesting Process */}
          {quality.harvestingProcess && (
            <div className="mb-6 bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
              <h3 className="text-lg font-bold text-yellow-900 mb-3">Harvesting & Processing</h3>
              <p className="text-gray-700 leading-relaxed">{quality.harvestingProcess}</p>
            </div>
          )}

          {/* Applications */}
          <div className="mb-6 bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Common Applications</h3>
            <p className="text-gray-700 leading-relaxed">{quality.applications}</p>
          </div>

          {/* Market Value */}
          {quality.marketValue && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border-2 border-teal-200">
              <h3 className="text-lg font-bold text-teal-900 mb-3">Market Value & Demand</h3>
              <p className="text-gray-700 leading-relaxed">{quality.marketValue}</p>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BuyerDetailsModalProps {
  show: boolean;
  onClose: () => void;
}

export const BuyerDetailsModal: React.FC<BuyerDetailsModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  const buyerDetails = {
    businessName: "Nonoy Abaca Trading",
    ownerName: "Venees Panghilinan Rillo",
    address: "Prk 4 San Pedro, Prosperidad, Agusan Del Sur",
    contactNumber: "09855744095",
    email: "veneespangilinanrillo@gmail.com",
    buyingSchedule: "Monday - Sunday",
    acceptedGrades: "Class A, B, and C",
    priceRangeMin: "₱30.00",
    priceRangeMax: "₱88.00",
    paymentTerms: "Cash on Delivery"
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 bg-white/20 backdrop-blur-md rounded-full p-2.5 hover:bg-white/30 transition shadow-lg z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">
                  ✓ MAO Verified Buyer
                </span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">{buyerDetails.businessName}</h2>
            <p className="text-emerald-50 text-xl font-medium">Complete Business Information</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 bg-gray-50">
          {/* Business Information */}
          <div className="space-y-5">
            {/* Business Name */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business Name</p>
                  <p className="text-xl font-bold text-gray-900">{buyerDetails.businessName}</p>
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Owner Name</p>
                  <p className="text-xl font-bold text-gray-900">{buyerDetails.ownerName}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business Address</p>
                  <p className="text-lg font-semibold text-gray-900">{buyerDetails.address}</p>
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Contact Number */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</p>
                    <a href={`tel:${buyerDetails.contactNumber}`} className="text-lg font-bold text-gray-900 hover:text-emerald-600 transition">
                      {buyerDetails.contactNumber}
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</p>
                    <a href={`mailto:${buyerDetails.email}`} className="text-base font-semibold text-gray-900 hover:text-emerald-600 transition break-all">
                      {buyerDetails.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Buying Schedule */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Buying Schedule</p>
                  <p className="text-xl font-bold text-gray-900">{buyerDetails.buyingSchedule}</p>
                </div>
              </div>
            </div>

            {/* Accepted Quality Grades */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-md">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-600 mr-3" />
                <h3 className="text-xl font-bold text-emerald-900">Accepted Quality Grades</h3>
              </div>
              <p className="text-xl font-bold text-gray-900">{buyerDetails.acceptedGrades}</p>
            </div>

            {/* Price Range */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <span className="text-2xl font-bold text-white">₱</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900">Price Range</h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-black text-blue-900">{buyerDetails.priceRangeMin}</span>
                <span className="text-2xl text-gray-500 font-bold">—</span>
                <span className="text-3xl font-black text-blue-900">{buyerDetails.priceRangeMax}</span>
                <span className="text-base text-gray-700 font-semibold ml-2">per kilogram</span>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
              <div className="flex items-center mb-3">
                <CreditCard className="w-7 h-7 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-purple-900">Payment Terms</h3>
              </div>
              <p className="text-xl font-bold text-gray-900">{buyerDetails.paymentTerms}</p>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-center">
            <button 
              onClick={onClose}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
