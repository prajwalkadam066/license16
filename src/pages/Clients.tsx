// src/pages/Clients.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  X,
  User,
  MapPin,
  Building2,
  FileText,
  Receipt,
  Hash,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";

interface Client {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  company_name: string;
  gst_treatment: string;
  source_of_supply: string;
  pan: string;
  currency_id: string;
  mode_of_payment: string;
  amount: number;
  quantity: number;
  created_at: string;
}

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    company_name: "",
    gst_treatment: "",
    source_of_supply: "",
    pan: "",
    currency_id: "",
    mode_of_payment: "",
    amount: "",
    quantity: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = localStorage.getItem('auth_session');
      let authHeaders: Record<string, string> = {};
      if (session) {
        try {
          const userData = JSON.parse(session);
          if (userData.token) {
            authHeaders['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (e) {
          // Invalid session, ignore
        }
      }

      const response = await fetch(`${getApiBaseUrl()}/clients`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clients');
      }

      setClients(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const clientData = {
        name: formData.name.trim(),
        contact_person: formData.contact_person.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        company_name: formData.company_name.trim(),
        gst_treatment: formData.gst_treatment.trim(),
        source_of_supply: formData.source_of_supply.trim(),
        pan: formData.pan.trim().toUpperCase(),
        currency_id: formData.currency_id || null,
        mode_of_payment: formData.mode_of_payment.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : null,
        quantity: formData.quantity ? parseInt(formData.quantity, 10) : null,
      };

      const url = editingClient 
        ? `${getApiBaseUrl()}/clients/${editingClient.id}`
        : `${getApiBaseUrl()}/clients`;
      
      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save client');
      }

      await fetchClients();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contact_person: client.contact_person || "",
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      company_name: client.company_name || "",
      gst_treatment: client.gst_treatment || "",
      source_of_supply: client.source_of_supply || "",
      pan: client.pan || "",
      currency_id: client.currency_id || "",
      mode_of_payment: client.mode_of_payment || "",
      amount: client.amount?.toString() || "",
      quantity: client.quantity?.toString() || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const session = localStorage.getItem('auth_session');
      let authHeaders: Record<string, string> = {};
      if (session) {
        try {
          const userData = JSON.parse(session);
          if (userData.token) {
            authHeaders['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (e) {
          // Invalid session, ignore
        }
      }

      const response = await fetch(`${getApiBaseUrl()}/clients`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: clientId }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Failed to delete client");

      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      company_name: "",
      gst_treatment: "",
      source_of_supply: "",
      pan: "",
      currency_id: "",
      mode_of_payment: "",
      amount: "",
      quantity: "",
    });
    setEditingClient(null);
    setIsFormOpen(false);
  };

  const filteredClients = clients.filter(
    (client) =>
      (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.phone || '').includes(searchTerm),
  );

  return (
  <div className="space-y-4 mt-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <button
          onClick={() => {
            setEditingClient(null);
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-2.5" />
          Add New Client
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Client Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                {editingClient ? "Edit Client" : "Add New Client"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editingClient ? "Update client information" : "Fill in the details to add a new client"}
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-white/50 dark:hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-5 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      required
                      placeholder="Enter client name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="contact_person"
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors resize-none"
                      rows={3}
                      placeholder="Complete address with city, state, and postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax & Compliance Section */}
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-5 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Tax & Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gst_treatment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Treatment
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      id="gst_treatment"
                      value={formData.gst_treatment}
                      onChange={(e) => setFormData({ ...formData, gst_treatment: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors appearance-none"
                    >
                      <option value="">Select GST Treatment</option>
                      <option value="Registered Business - Regular">Registered Business - Regular</option>
                      <option value="Registered Business - Composition">Registered Business - Composition</option>
                      <option value="Unregistered Business">Unregistered Business</option>
                      <option value="Overseas">Overseas</option>
                      <option value="Special Economic Zone">Special Economic Zone</option>
                      <option value="Deemed Export">Deemed Export</option>
                      <option value="Tax Deductor">Tax Deductor</option>
                      <option value="SEZ Developer">SEZ Developer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="source_of_supply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source of Supply
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="source_of_supply"
                      type="text"
                      value={formData.source_of_supply}
                      onChange={(e) => setFormData({ ...formData, source_of_supply: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="State/Country of supply"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="pan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PAN Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="pan"
                      type="text"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors uppercase"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600 font-medium transition-colors text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {formLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {editingClient ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {editingClient ? "Update Client" : "Add Client"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Hash className="h-3 w-3 mr-1" />
                    Sr No
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Client Name
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Contact Person
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    Phone
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    Company
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Address
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Receipt className="h-3 w-3 mr-1" />
                    GST Treatment
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Source of Supply
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Hash className="h-3 w-3 mr-1" />
                    PAN
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span className="ml-2 text-sm">Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm"
                  >
                    {searchTerm
                      ? "No clients found matching your search"
                      : "No clients added yet"}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="hover:underline text-left"
                      >
                        {client.name}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.contact_person && client.contact_person.trim() !== '' ? client.contact_person : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.email && client.email.trim() !== '' ? client.email : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.phone && client.phone.trim() !== '' ? client.phone : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.company_name && client.company_name.trim() !== '' ? client.company_name : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {client.address && client.address.trim() !== '' ? client.address : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.gst_treatment && client.gst_treatment.trim() !== '' ? client.gst_treatment : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.source_of_supply && client.source_of_supply.trim() !== '' ? client.source_of_supply : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.pan && client.pan.trim() !== '' ? client.pan : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          aria-label="Edit client"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          aria-label="Delete client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Clients;
