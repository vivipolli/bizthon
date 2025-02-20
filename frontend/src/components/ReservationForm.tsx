import React from "react";

interface FormData {
  vegetationCoverage: string;
  hectaresNumber: string;
  specificAttributes: string;
  waterBodiesCount: string;
  springsCount: string;
  ongoingProjects: string;
  carRegistry: string;
  longitude: string;
  latitude: string;
  bufferKm: string;
}

interface ReservationFormProps {
  formData: FormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setShowForm: (show: boolean) => void;
}

export function ReservationForm({
  formData,
  handleInputChange,
  handleSubmit,
  setShowForm,
}: ReservationFormProps) {
  return (
    <div className="mt-4 border-t pt-4 max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#45803B] mb-6">
        New Reservation Request
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h4 className="text-xl font-semibold mb-4 text-[#182c15] py-2">
          Environmental Data{" "}
        </h4>
        <div className="flex gap-4 grid-cols-3">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Specify the percentage of native vegetation cover"
            >
              Vegetation Coverage (%)
            </label>
            <input
              type="number"
              name="vegetationCoverage"
              value={formData.vegetationCoverage}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Specify the percentage of native vegetation cover"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Indicate the total area to be registered"
            >
              Land Area (Hectares)
            </label>
            <input
              type="number"
              name="hectaresNumber"
              value={formData.hectaresNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Indicate the total area to be registered"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Number of Water Bodies – Count lakes, rivers, and ponds within the area"
            >
              Water Resources
            </label>
            <input
              type="number"
              name="waterBodiesCount"
              value={formData.waterBodiesCount}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Number of Water Bodies – Count lakes, rivers, and ponds within the area"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Specify the number of natural freshwater sources"
            >
              Number of Springs
            </label>
            <input
              type="number"
              name="springsCount"
              value={formData.springsCount}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Specify the number of natural freshwater sources"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key Ecological Features
          </label>
          <textarea
            name="specificAttributes"
            value={formData.specificAttributes}
            onChange={handleInputChange}
            placeholder="E.g.: Presence of centenary trees, refuge area for endangered species"
            rows={4}
            className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
            required
          />
        </div>

        <h4 className="text-xl font-semibold mb-4 text-[#182c15] py-2">
          Geospatial & Registry Information
        </h4>

        <div className="flex grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              placeholder="e.g. -57.000"
              step="0.001"
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              placeholder="e.g. -16.500"
              step="0.001"
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Define the protective perimeter around the registered area"
            >
              Buffer Zone (km)
            </label>
            <input
              type="number"
              name="bufferKm"
              value={formData.bufferKm}
              onChange={handleInputChange}
              placeholder="Buffer in kilometers"
              min="0"
              step="0.1"
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Define the protective perimeter around the registered area"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help"
              title="Official registration code for environmental compliance"
            >
              CAR Registry ID
            </label>
            <input
              type="text"
              name="carRegistry"
              value={formData.carRegistry}
              onChange={handleInputChange}
              placeholder="CAR-123456789-XX"
              className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
              required
              title="Official registration code for environmental compliance"
            />
          </div>
        </div>

        <h4 className="text-xl font-semibold mb-4 text-[#182c15] py-2">
          Ongoing Projects & Sustainability Efforts:
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ongoing Projects
          </label>
          <textarea
            name="ongoingProjects"
            value={formData.ongoingProjects}
            onChange={handleInputChange}
            placeholder="Ex: Active conservation and restoration initiatives,  agroforestry projects, soil recovery programs, collaboration with local communities, partnership with in enous groups, scientific research, monitoring programs."
            rows={4}
            className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-sm"
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="bg-[#45803B] cursor-pointer text-white px-8 py-3 rounded-md hover:bg-[#386832] transition-colors text-base font-medium"
          >
            Submit Request
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className=" cursor-pointer bg-gray-200 text-gray-800 px-8 py-3 rounded-md hover:bg-gray-300 transition-colors text-base font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
