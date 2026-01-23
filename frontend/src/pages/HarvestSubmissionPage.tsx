import { useState, useEffect } from 'react';
import { getAuthToken, getAuthHeader } from '../utils/authToken';

interface FarmerProfile {
  full_name: string;
  contact_number: string;
  municipality: string;
  barangay: string;
  association_name: string;
  farm_location: string;
  farm_coordinates: string;
  farm_area_hectares: number;
}

interface PlantedSeedling {
  variety: string;
  planting_date: string;
  planting_location: string;
  planting_notes: string;
}

interface HarvestFormData {
  // Farm Location (optional)
  farm_coordinates: string;
  landmark: string;
  farm_name: string;
  farm_code: string;
  area_hectares: string;
  plot_lot_id: string;

  // Planting Info
  abaca_variety: string;
  planting_date: string;
  planting_material_source: string;
  planting_density_hills_per_ha: string;
  planting_spacing: string;

  // Harvest Details
  harvest_date: string;
  harvest_shift: string;
  harvest_crew_name: string;
  harvest_method: string;
  stalks_harvested: string;
  wet_weight_kg: string;
  dry_fiber_output_kg: string;
  yield_per_hectare_kg: string;

  // Quality
  fiber_grade: string;
  fiber_color: string;
  moisture_status: string;
  bales_produced: string;
  weight_per_bale_kg: string;

  // Pest/Disease
  pests_observed: boolean;
  pests_description: string;
  diseases_observed: boolean;
  diseases_description: string;
  remarks: string;
}

export default function HarvestSubmissionPage() {
  const [loading, setLoading] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [, setPlantedSeedlings] = useState<PlantedSeedling[]>([]);
  const [formData, setFormData] = useState<HarvestFormData>({
    farm_coordinates: '',
    landmark: '',
    farm_name: '',
    farm_code: '',
    area_hectares: '',
    plot_lot_id: '',
    abaca_variety: '',
    planting_date: '',
    planting_material_source: 'Tissue Culture',
    planting_density_hills_per_ha: '',
    planting_spacing: '',
    harvest_date: new Date().toISOString().split('T')[0],
    harvest_shift: 'Morning',
    harvest_crew_name: '',
    harvest_method: 'Manual Tuxying + Hand Stripping',
    stalks_harvested: '',
    wet_weight_kg: '',
    dry_fiber_output_kg: '',
    yield_per_hectare_kg: '',
    fiber_grade: 'Grade A',
    fiber_color: 'White',
    moisture_status: 'Sun-dried',
    bales_produced: '',
    weight_per_bale_kg: '',
    pests_observed: false,
    pests_description: '',
    diseases_observed: false,
    diseases_description: '',
    remarks: ''
  });

  useEffect(() => {
    fetchFarmerProfile();
    fetchPlantedSeedlings();
  }, []);

  const fetchPlantedSeedlings = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      // 1. Fetch planted seedlings
      const seedlingsRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/farmer/received', {
        headers: getAuthHeader()
      });

      // 2. Fetch existing harvests to check what's already been harvested
      const harvestsRes = await fetch('https://easyabaca-api.vercel.app/api/harvests/farmer/harvests', {
        headers: getAuthHeader()
      });

      if (seedlingsRes.ok && harvestsRes.ok) {
        const seedlingsData = await seedlingsRes.json();
        const harvestsData = await harvestsRes.json();

        const allPlanted = (seedlingsData || []).filter((s: any) => s.status === 'planted');
        const allHarvests = harvestsData.harvests || [];

        setPlantedSeedlings(allPlanted);

        if (allPlanted.length > 0) {
          // Find the first planted seedling that hasn't been harvested yet
          // Match by variety and planting date
          const unharvested = allPlanted.find((s: any) => {
            const sDate = new Date(s.planting_date).toISOString().split('T')[0];
            const alreadyHarvested = allHarvests.some((h: any) =>
              h.abaca_variety === s.variety &&
              h.planting_date === sDate
            );
            return !alreadyHarvested;
          });

          // If no unharvested found, fallback to the most recent planted one
          const target = unharvested || allPlanted[0];

          if (target) {
            console.log('🌱 Auto-filling from seedling:', target);
            setFormData(prev => ({
              ...prev,
              abaca_variety: target.variety || '',
              planting_date: target.planting_date ? new Date(target.planting_date).toISOString().split('T')[0] : '',
              planting_material_source: ['Sucker', 'Corm', 'Tissue Culture', 'Other'].includes(target.planting_material_source || '')
                ? target.planting_material_source
                : (['Sucker', 'Corm', 'Tissue Culture', 'Other'].includes(target.planting_notes || '')
                  ? target.planting_notes
                  : 'Tissue Culture'),
              planting_spacing: target.planting_location || ''
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data for auto-fill:', error);
    }
  };

  const fetchFarmerProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('https://easyabaca-api.vercel.app/api/farmers/profile', {
        headers: getAuthHeader()
      });

      if (response.ok) {
        const data = await response.json();
        setFarmerProfile(data.farmer);

        // Auto-fill farm location fields from profile
        if (data.farmer) {
          setFormData(prev => ({
            ...prev,
            farm_coordinates: data.farmer.farm_coordinates || '',
            landmark: data.farmer.farm_location || '',
            area_hectares: data.farmer.farm_area_hectares ? data.farmer.farm_area_hectares.toString() : ''
          }));
        }
      } else {
        console.warn('Failed to fetch farmer profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching farmer profile (backend may be offline):', error);
      // Continue anyway - user can still fill the form
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAuthToken();

      if (!token) {
        alert('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Token exists:', !!token);

      const today = new Date().toISOString().split('T')[0];
      if (formData.harvest_date > today) {
        alert('Harvest date cannot be in the future.');
        setLoading(false);
        return;
      }

      if (formData.planting_date > formData.harvest_date) {
        alert('Planting date cannot be after the harvest date.');
        setLoading(false);
        return;
      }

      // Convert string numbers to actual numbers
      const payload = {
        ...formData,
        area_hectares: parseFloat(formData.area_hectares) || 0,
        planting_density_hills_per_ha: formData.planting_density_hills_per_ha ? parseInt(formData.planting_density_hills_per_ha) : null,
        stalks_harvested: formData.stalks_harvested ? parseInt(formData.stalks_harvested) : null,
        wet_weight_kg: formData.wet_weight_kg ? parseFloat(formData.wet_weight_kg) : null,
        dry_fiber_output_kg: formData.dry_fiber_output_kg ? parseFloat(formData.dry_fiber_output_kg) : null,
        yield_per_hectare_kg: formData.yield_per_hectare_kg ? parseFloat(formData.yield_per_hectare_kg) : null,
        bales_produced: formData.bales_produced ? parseInt(formData.bales_produced) : null,
        weight_per_bale_kg: formData.weight_per_bale_kg ? parseFloat(formData.weight_per_bale_kg) : null
      };

      if (payload.area_hectares <= 0) {
        alert('Area must be greater than 0.');
        setLoading(false);
        return;
      }

      console.log('Submitting payload:', payload);

      const response = await fetch('https://easyabaca-api.vercel.app/api/harvests/farmer/harvests', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        alert('Harvest submitted successfully! Redirecting to harvest list...');
        // Trigger a custom event to notify parent component
        window.dispatchEvent(new CustomEvent('harvestSubmitted'));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);

        if (response.status === 401) {
          alert('Authentication failed. Your session may have expired. Please logout and login again.');
        } else {
          const errorMessage = errorData.message || errorData.error || 'Failed to submit harvest';
          alert(`Error: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error submitting harvest:', error);
      alert('Failed to submit harvest. Please make sure the backend server is running (npm run dev in backend folder).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit New Harvest</h1>
          <p className="text-gray-600 text-lg">Record your abaca harvest details</p>
        </div>

        {/* Auto-filled Farmer Info */}
        {farmerProfile && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Farmer Information (Auto-filled)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Name</p>
                <p className="font-semibold text-lg text-gray-900">{farmerProfile.full_name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Contact</p>
                <p className="font-semibold text-lg text-gray-900">{farmerProfile.contact_number}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Municipality</p>
                <p className="font-semibold text-lg text-gray-900">{farmerProfile.municipality}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Barangay</p>
                <p className="font-semibold text-lg text-gray-900">{farmerProfile.barangay}</p>
              </div>
              {farmerProfile.association_name && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 md:col-span-2">
                  <p className="text-gray-500 text-xs mb-1">Association</p>
                  <p className="font-semibold text-lg text-gray-900">{farmerProfile.association_name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Farm Location */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Farm Location</h2>
                <p className="text-sm text-emerald-600">Auto-filled from your profile</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (Hectares) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area_hectares"
                  step="0.01"
                  required
                  value={formData.area_hectares}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Coordinates (GPS or Description)
                </label>
                <input
                  type="text"
                  name="farm_coordinates"
                  placeholder="e.g., 7.6298, 125.4737"
                  value={formData.farm_coordinates}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  name="farm_name"
                  value={formData.farm_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Planting Information */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Planting Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abaca Variety <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="abaca_variety"
                  required
                  placeholder="e.g., Maguindanao, Abuab, Tangongon, Laylay, etc."
                  value={formData.abaca_variety}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Common varieties: Maguindanao, Abuab, Tangongon, Laylay, Inosa, Linawaan</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planting Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="planting_date"
                  required
                  value={formData.planting_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planting Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="planting_material_source"
                  required
                  value={formData.planting_material_source}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="Tissue Culture">Tissue Culture</option>
                  <option value="Sucker">Sucker</option>
                  <option value="Corm">Corm</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="planting_spacing"
                  placeholder="e.g., Farm A, Plot 1"
                  value={formData.planting_spacing}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Harvest Details */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Harvest Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="harvest_date"
                  required
                  value={formData.harvest_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="harvest_method"
                  required
                  value={formData.harvest_method}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="Manual Tuxying + Hand Stripping">Manual Tuxying + Hand Stripping</option>
                  <option value="Mechanical Stripping">Mechanical Stripping</option>
                  <option value="MSSM">MSSM</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stalks Harvested</label>
                <input
                  type="number"
                  name="stalks_harvested"
                  value={formData.stalks_harvested}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dry Fiber Output (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="dry_fiber_output_kg"
                  step="0.01"
                  required
                  value={formData.dry_fiber_output_kg}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wet Weight (kg)</label>
                <input
                  type="number"
                  name="wet_weight_kg"
                  step="0.01"
                  value={formData.wet_weight_kg}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yield per Hectare (kg/ha)</label>
                <input
                  type="number"
                  name="yield_per_hectare_kg"
                  step="0.01"
                  value={formData.yield_per_hectare_kg}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Quality & Grading */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quality & Grading</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiber Grade</label>
                <select
                  name="fiber_grade"
                  value={formData.fiber_grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moisture Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="moisture_status"
                  required
                  value={formData.moisture_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="Sun-dried">Sun-dried</option>
                  <option value="Semi-dried">Semi-dried</option>
                  <option value="Wet">Wet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiber Color</label>
                <input
                  type="text"
                  name="fiber_color"
                  value={formData.fiber_color}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bales Produced</label>
                <input
                  type="number"
                  name="bales_produced"
                  value={formData.bales_produced}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Pest & Disease Observations */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pest & Disease Observations</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="pests_observed"
                  checked={formData.pests_observed}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Pests Observed</label>
              </div>
              {formData.pests_observed && (
                <textarea
                  name="pests_description"
                  placeholder="Describe the pests observed..."
                  value={formData.pests_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="diseases_observed"
                  checked={formData.diseases_observed}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Diseases Observed</label>
              </div>
              {formData.diseases_observed && (
                <textarea
                  name="diseases_description"
                  placeholder="Describe the diseases observed..."
                  value={formData.diseases_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              )}
            </div>
          </section>

          {/* Remarks */}
          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <label className="text-xl font-bold text-gray-900">Additional Remarks</label>
            </div>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              placeholder="Any additional notes or observations..."
            />
          </section>

          {/* Submit Button */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-8 rounded-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submit Harvest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
