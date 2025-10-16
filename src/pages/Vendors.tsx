import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  X,
  User,
  MapPin,
  CreditCard,
  FileText,
  Package,
  IndianRupee,
  Hash,
  Receipt,
  Calendar,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  gst_treatment: string;
  source_of_supply: string;
  gst: string;
  currency_id: string;
  mode_of_payment: string;
  amount: number;
  quantity: number;
  created_at: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_inr: number;
}

function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    gst_treatment: "",
    source_of_supply: "",
    gst: "",
    currency_id: "",
    mode_of_payment: "",
    amount: "",
    quantity: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/currencies`);
      const result = await response.json();
      
      if (result.success) {
        setCurrencies(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/vendors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vendors');
      }

      setVendors(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const vendorData = {
        name: formData.name.trim(),
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        company_name: formData.company_name.trim(),
        gst_treatment: formData.gst_treatment.trim(),
        source_of_supply: formData.source_of_supply.trim(),
        gst: formData.gst.trim(),
        currency_id: formData.currency_id || null,
        mode_of_payment: formData.mode_of_payment.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : null,
        quantity: formData.quantity ? parseInt(formData.quantity, 10) : null,
      };

      const url = editingVendor 
        ? `${getApiBaseUrl()}/vendors/${editingVendor.id}`
        : `${getApiBaseUrl()}/vendors`;
      
      const method = editingVendor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save vendor');
      }

      await fetchVendors();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      company_name: vendor.company_name || "",
      gst_treatment: vendor.gst_treatment || "",
      source_of_supply: vendor.source_of_supply || "",
      gst: vendor.gst || "",
      currency_id: vendor.currency_id || "",
      mode_of_payment: vendor.mode_of_payment || "",
      amount: vendor.amount?.toString() || "",
      quantity: vendor.quantity?.toString() || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/vendors`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: vendorId }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Failed to delete vendor");

      await fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      contact_person: "", 
      email: "", 
      phone: "", 
      address: "", 
      company_name: "",
      gst_treatment: "",
      source_of_supply: "",
      gst: "",
      currency_id: "",
      mode_of_payment: "",
      amount: "",
      quantity: "",
    });
    setEditingVendor(null);
    setIsFormOpen(false);
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      (vendor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (vendor.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (vendor.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (vendor.phone || '').includes(searchTerm),
  );

  return (
    <div className="space-y-4 mt-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vendors</h1>
        <button
          onClick={() => {
            setEditingVendor(null);
            setFormData({
              name: "",
              contact_person: "",
              email: "",
              phone: "",
              address: "",
              company_name: "",
              gst_treatment: "",
              source_of_supply: "",
              gst: "",
              currency_id: "",
              mode_of_payment: "",
              amount: "",
              quantity: "",
            });
            setIsFormOpen(true);
          }}
          className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-2.5" />
          Add New Vendor
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                {editingVendor ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editingVendor ? "Update vendor information" : "Fill in the details to add a new vendor"}
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
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      required
                      placeholder="Enter vendor name"
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
                      placeholder="vendor@example.com"
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
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="gst"
                      type="text"
                      value={formData.gst}
                      onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors uppercase"
                      placeholder="GST Number (15 digits)"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-5 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="currency_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                      {formData.currency_id 
                        ? currencies.find(c => c.id === formData.currency_id)?.symbol || '$'
                        : '$'
                      }
                    </span>
                    <select
                      id="currency_id"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors appearance-none"
                    >
                      <option value="">Select Currency</option>
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="mode_of_payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode of Payment
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      id="mode_of_payment"
                      value={formData.mode_of_payment}
                      onChange={(e) => setFormData({ ...formData, mode_of_payment: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors appearance-none"
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="created_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="created_date"
                      type="text"
                      value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      readOnly
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-600 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                      {formData.currency_id 
                        ? currencies.find(c => c.id === formData.currency_id)?.symbol || '$'
                        : '$'
                      }
                    </span>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Amount Calculation Display */}
              {formData.amount && formData.currency_id && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-dark-600 rounded-lg border border-blue-200 dark:border-blue-900/30">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-lg">₹</span>
                    Amount Calculation (INR)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-dark-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original Amount</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {currencies.find(c => c.id === formData.currency_id)?.symbol || ''} {parseFloat(formData.amount).toFixed(2)}
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                          ({currencies.find(c => c.id === formData.currency_id)?.code || ''})
                        </span>
                      </p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Cost (INR) {formData.quantity && `(× ${formData.quantity})`}</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹ {(() => {
                          const selectedCurrency = currencies.find(c => c.id === formData.currency_id);
                          const exchangeRate = selectedCurrency?.exchange_rate_to_inr || 1;
                          const amount = parseFloat(formData.amount) || 0;
                          const quantity = parseInt(formData.quantity) || 1;
                          const totalInINR = amount * quantity * exchangeRate;
                          return totalInINR.toFixed(2);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    {editingVendor ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {editingVendor ? "Update Vendor" : "Add Vendor"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search vendors by name, contact person, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Vendor Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-purple-600" />
                    Contact Person
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-green-600" />
                    Email
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-orange-600" />
                    Phone
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Company
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Address
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-yellow-600" />
                    GST Treatment
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Source of Supply
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-pink-600" />
                    GST
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    Currency
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-violet-600" />
                    Payment Mode
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    Amount
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-blue-600" />
                    Quantity
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                    Created Date
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-dark-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {loading ? (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-3"></div>
                      <span className="text-sm font-medium">Loading vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-medium">
                        {searchTerm
                          ? "No vendors found matching your search"
                          : "No vendors added yet"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {!searchTerm && "Click 'Add New Vendor' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {vendor.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.contact_person && vendor.contact_person.trim() !== '' ? vendor.contact_person : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.email && vendor.email.trim() !== '' ? vendor.email : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.phone && vendor.phone.trim() !== '' ? vendor.phone : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.company_name && vendor.company_name.trim() !== '' ? vendor.company_name : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={vendor.address}>
                      {vendor.address && vendor.address.trim() !== '' ? vendor.address : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.gst_treatment && vendor.gst_treatment.trim() !== '' ? vendor.gst_treatment : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.source_of_supply && vendor.source_of_supply.trim() !== '' ? vendor.source_of_supply : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {vendor.gst && vendor.gst.trim() !== '' ? vendor.gst : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.currency_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                          {currencies.find(c => c.id === vendor.currency_id)?.code || vendor.currency_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.mode_of_payment && vendor.mode_of_payment.trim() !== '' ? vendor.mode_of_payment : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {vendor.amount ? (
                        <div className="space-y-1">
                          {/* Show INR amount at the top (highlighted) */}
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-base">
                            ₹ {(() => {
                              const amount = parseFloat(vendor.amount.toString()) || 0;
                              const exchangeRate = currencies.find(c => c.id === vendor.currency_id)?.exchange_rate_to_inr || 1;
                              return (amount * exchangeRate).toFixed(2);
                            })()}
                          </div>
                          {/* Show original currency amount below (only if not INR) */}
                          {vendor.currency_id && currencies.find(c => c.id === vendor.currency_id)?.code !== 'INR' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                              Original: {currencies.find(c => c.id === vendor.currency_id)?.symbol || ''} {parseFloat(vendor.amount.toString()).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.quantity !== null && vendor.quantity !== undefined ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                          {vendor.quantity}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.created_at ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(vendor.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 sticky right-0 bg-white dark:bg-dark-800">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
                          aria-label="Edit vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 rounded-lg transition-colors"
                          aria-label="Delete vendor"
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

export default Vendors;
