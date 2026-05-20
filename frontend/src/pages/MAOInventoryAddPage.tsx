import { useState, useEffect } from 'react';

interface Harvest {
  harvest_id: string;
  farmer_name: string;
  harvest_date: string;
  abaca_variety: string;
  dry_fiber_output_kg: number;
  fiber_grade: string;
  municipality: string;
  barangay: string;
}

export default function MAOInventoryAddPage() {
  const harvestId = new URLSearchParams(window.location.search).get('harvestId');
  const [loading, setLoading] = useState(false);
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [formData, setFormData] = useState({
    stock_weight_kg: '',
    fiber_grade: '',
    fiber_quality_rating: 'Good',
    storage_location: '',
    warehouse_section: '',
    storage_condition: 'Dry',
    storage_temperature_celsius: '',
    storage_humidity_percent: '',
    quality_check_date: new Date().toISOString().split('T')[0],
    quality_checked_by: '',
    quality_notes: '',
    expiry_date: '',
    unit_price_per_kg: '',
    remarks: ''
  });

  useEffect(() => {
    if (harvestId) {
      fetchHarvestDetails();
    }
  }, [harvestId]);

  const fetchHarvestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://server.easyabaca.site/api/harvests/mao/harvests?status=Verified`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const foundHarvest = data.harvests.find((h: Harvest) => h.harvest_id === harvestId);

        if (foundHarvest) {
          setHarvest(foundHarvest);
          setFormData(prev => ({
            ...prev,
            stock_weight_kg: foundHarvest.dry_fiber_output_kg.toString(),
            fiber_grade: foundHarvest.fiber_grade || 'Grade A'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching harvest:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        harvest_id: harvestId,
        stock_weight_kg: parseFloat(formData.stock_weight_kg),
        fiber_grade: formData.fiber_grade,
        fiber_quality_rating: formData.fiber_quality_rating,
        storage_location: formData.storage_location,
        warehouse_section: formData.warehouse_section,
        storage_condition: formData.storage_condition,
        storage_temperature_celsius: formData.storage_temperature_celsius ? parseFloat(formData.storage_temperature_celsius) : null,
        storage_humidity_percent: formData.storage_humidity_percent ? parseFloat(formData.storage_humidity_percent) : null,
        quality_check_date: formData.quality_check_date,
        quality_checked_by: formData.quality_checked_by,
        quality_notes: formData.quality_notes,
        expiry_date: formData.expiry_date || null,
        unit_price_per_kg: formData.unit_price_per_kg ? parseFloat(formData.unit_price_per_kg) : null,
        remarks: formData.remarks
      };

      const response = await fetch('https://server.easyabaca.site/api/inventory/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Added to inventory successfully!');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      alert('Failed to add to inventory');
    } finally {
      setLoading(false);
    }
  };

  if (!harvest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading harvest details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-green-800 mb-6">Add to Inventory</h1>

          {/* Harvest Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Harvest Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Farmer:</span>
                <span className="ml-2 font-medium">{harvest.farmer_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{harvest.municipality}, {harvest.barangay}</span>
              </div>
              <div>
                <span className="text-gray-600">Variety:</span>
                <span className="ml-2 font-medium">{harvest.abaca_variety}</span>
              </div>
              <div>
                <span className="text-gray-600">Harvest Date:</span>
                <span className="ml-2 font-medium">{new Date(harvest.harvest_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Fiber Output:</span>
                <span className="ml-2 font-medium">{harvest.dry_fiber_output_kg} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Grade:</span>
                <span className="ml-2 font-medium">{harvest.fiber_grade}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stock Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Stock Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock_weight_kg"
                    step="0.01"
                    required
                    value={formData.stock_weight_kg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiber Grade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fiber_grade"
                    required
                    value={formData.fiber_grade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fiber_quality_rating"
                    required
                    value={formData.fiber_quality_rating}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price per kg</label>
                  <input
                    type="number"
                    name="unit_price_per_kg"
                    step="0.01"
                    value={formData.unit_price_per_kg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </section>

            {/* Storage Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    name="storage_location"
                    placeholder="e.g., Warehouse A"
                    value={formData.storage_location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Section</label>
                  <input
                    type="text"
                    name="warehouse_section"
                    placeholder="e.g., Section 1"
                    value={formData.warehouse_section}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Condition</label>
                  <select
                    name="storage_condition"
                    value={formData.storage_condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Dry">Dry</option>
                    <option value="Humid">Humid</option>
                    <option value="Controlled">Controlled</option>
                    <option value="Open Air">Open Air</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    name="storage_temperature_celsius"
                    step="0.1"
                    value={formData.storage_temperature_celsius}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    name="storage_humidity_percent"
                    step="0.1"
                    value={formData.storage_humidity_percent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </section>

            {/* Quality Control */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quality Control</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Check Date</label>
                  <input
                    type="date"
                    name="quality_check_date"
                    value={formData.quality_check_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checked By</label>
                  <input
                    type="text"
                    name="quality_checked_by"
                    value={formData.quality_checked_by}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Notes</label>
                  <textarea
                    name="quality_notes"
                    rows={3}
                    value={formData.quality_notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </section>

            {/* Remarks */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
              <textarea
                name="remarks"
                rows={3}
                value={formData.remarks}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </section>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
              >
                {loading ? 'Adding to Inventory...' : 'Add to Inventory'}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
