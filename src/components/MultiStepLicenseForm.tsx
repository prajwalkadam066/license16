import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface MultiStepLicenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_inr: string;
  is_default: boolean;
}

function MultiStepLicenseForm({ isOpen, onClose, onSuccess }: MultiStepLicenseFormProps) {
  const [step, setStep] = useState(1);

  // Step 1: Client & License Information
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [toolName, setToolName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [costPerUser, setCostPerUser] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState('');
  
  // Client Information fields
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompanyName, setClientCompanyName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGstTreatment, setClientGstTreatment] = useState('');
  const [clientSourceOfSupply, setClientSourceOfSupply] = useState('');
  const [clientGst, setClientGst] = useState('');
  const [clientCurrencyId, setClientCurrencyId] = useState('');
  
  // Step 2: Vendor Information
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorCompanyName, setVendorCompanyName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGstTreatment, setVendorGstTreatment] = useState('');
  const [vendorSourceOfSupply, setVendorSourceOfSupply] = useState('');
  const [vendorGst, setVendorGst] = useState('');
  const [vendorCurrencyId, setVendorCurrencyId] = useState('');
  const [vendorModeOfPayment, setVendorModeOfPayment] = useState('');
  const [vendorAmount, setVendorAmount] = useState('');
  const [vendorQuantity, setVendorQuantity] = useState('');
  
  // Currency support
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients, vendors and currencies when form opens
  useEffect(() => {
    const fetchClientsAndCurrencies = async () => {
      try {
        // Fetch clients
        const clientsResponse = await fetch(`${getApiBaseUrl()}/clients`);
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) {
          setClients(clientsResult.data || []);
        }

        // Fetch vendors
        const vendorsResponse = await fetch(`${getApiBaseUrl()}/vendors`);
        const vendorsResult = await vendorsResponse.json();
        if (vendorsResult.success) {
          setVendors(vendorsResult.data || []);
        }

        // Fetch currencies
        const currenciesResponse = await fetch(`${getApiBaseUrl()}/currencies`);
        const currenciesResult = await currenciesResponse.json();
        if (currenciesResult.success) {
          setCurrencies(currenciesResult.data || []);
          // Set default currency to INR
          const defaultCurrency = currenciesResult.data?.find((c: Currency) => c.is_default);
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency.code);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    if (isOpen) {
      fetchClientsAndCurrencies();
    }
  }, [isOpen]);

  const getSelectedCurrencyData = () => {
    return currencies.find(c => c.code === selectedCurrency);
  };

  const calculateTotalCost = () => {
    const cost = parseFloat(costPerUser) || 0;
    const qty = parseInt(quantity) || 0;
    return cost * qty;
  };

  const calculateTotalCostInINR = () => {
    const totalCost = calculateTotalCost();
    const currencyData = getSelectedCurrencyData();
    if (!currencyData) return totalCost;
    const exchangeRate = parseFloat(currencyData.exchange_rate_to_inr);
    return totalCost * exchangeRate;
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    
    if (!clientId) {
      // Clear all client fields if "Select a client" is chosen
      setClientContactPerson('');
      setClientEmail('');
      setClientPhone('');
      setClientCompanyName('');
      setClientAddress('');
      setClientGstTreatment('');
      setClientSourceOfSupply('');
      setClientGst('');
      setClientCurrencyId('');
      return;
    }
    
    // Find the selected client and populate all fields
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setClientContactPerson(selectedClient.contact_person || '');
      setClientEmail(selectedClient.email || '');
      setClientPhone(selectedClient.phone || '');
      setClientCompanyName(selectedClient.company_name || '');
      setClientAddress(selectedClient.address || '');
      setClientGstTreatment(selectedClient.gst_treatment || '');
      setClientSourceOfSupply(selectedClient.source_of_supply || '');
      setClientGst(selectedClient.gst || '');
      setClientCurrencyId(selectedClient.currency_id || '');
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    
    if (!vendorId) {
      // Clear all vendor fields if "Select a vendor" is chosen
      setVendorName('');
      setVendorContactPerson('');
      setVendorEmail('');
      setVendorPhone('');
      setVendorCompanyName('');
      setVendorAddress('');
      setVendorGstTreatment('');
      setVendorSourceOfSupply('');
      setVendorGst('');
      setVendorCurrencyId('');
      setVendorModeOfPayment('');
      setVendorAmount('');
      setVendorQuantity('');
      return;
    }
    
    // Find the selected vendor and populate all fields
    const selectedVendor = vendors.find(v => v.id === vendorId);
    if (selectedVendor) {
      setVendorName(selectedVendor.name || '');
      setVendorContactPerson(selectedVendor.contact_person || '');
      setVendorEmail(selectedVendor.email || '');
      setVendorPhone(selectedVendor.phone || '');
      setVendorCompanyName(selectedVendor.company_name || '');
      setVendorAddress(selectedVendor.address || '');
      setVendorGstTreatment(selectedVendor.gst_treatment || '');
      setVendorSourceOfSupply(selectedVendor.source_of_supply || '');
      setVendorGst(selectedVendor.gst || '');
      setVendorCurrencyId(selectedVendor.currency_id || '');
      setVendorModeOfPayment(selectedVendor.mode_of_payment || '');
      setVendorAmount(selectedVendor.amount || '');
      setVendorQuantity(selectedVendor.quantity || '');
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedClientId('');
    setInvoiceNo('');
    setToolName('');
    setMake('');
    setModel('');
    setVersion('');
    setCostPerUser('');
    setQuantity('1');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpirationDate('');
    setClientContactPerson('');
    setClientEmail('');
    setClientPhone('');
    setClientCompanyName('');
    setClientAddress('');
    setClientGstTreatment('');
    setClientSourceOfSupply('');
    setClientGst('');
    setClientCurrencyId('');
    setSelectedVendorId('');
    setVendorName('');
    setVendorContactPerson('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorCompanyName('');
    setVendorAddress('');
    setVendorGstTreatment('');
    setVendorSourceOfSupply('');
    setVendorGst('');
    setVendorCurrencyId('');
    setVendorModeOfPayment('');
    setVendorAmount('');
    setVendorQuantity('');
    setSelectedCurrency('INR');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate Step 1: License details
      if (!toolName.trim()) {
        setError('Tool Name is required');
        return;
      }
      if (!costPerUser || parseFloat(costPerUser) <= 0) {
        setError('Cost per User is required and must be greater than 0');
        return;
      }
      if (!quantity || parseInt(quantity) <= 0) {
        setError('Number of Licenses is required and must be greater than 0');
        return;
      }
      if (!purchaseDate) {
        setError('Purchase Date is required');
        return;
      }
      if (!expirationDate) {
        setError('Expiration Date is required');
        return;
      }
      
      setError(null);
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let vendorId = null;

      // Only create vendor if user entered NEW vendor details (no existing vendor selected)
      if (!selectedVendorId && vendorName.trim()) {
        // User wants to create a new vendor
        const vendorResponse = await fetch(`${getApiBaseUrl()}/vendors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: vendorName.trim(),
            contact_person: vendorContactPerson.trim() || null,
            email: vendorEmail.trim() || null,
            phone: vendorPhone.trim() || null,
            company_name: vendorCompanyName.trim() || null,
            address: vendorAddress.trim() || null,
            gst_treatment: vendorGstTreatment || null,
            source_of_supply: vendorSourceOfSupply || null,
            gst: vendorGst.trim() || null,
            currency_id: vendorCurrencyId || null,
            mode_of_payment: vendorModeOfPayment || null,
            amount: vendorAmount ? parseFloat(vendorAmount) : null,
            quantity: vendorQuantity ? parseInt(vendorQuantity) : null,
          }),
        });
        
        const vendorResult = await vendorResponse.json();
        
        if (!vendorResult.success) {
          throw new Error(vendorResult.error || 'Failed to create vendor');
        }
        
        vendorId = vendorResult.data.id;
      } else if (selectedVendorId) {
        // User selected an existing vendor - just use that ID
        vendorId = selectedVendorId;
      }

      // Calculate totals
      const totalCost = calculateTotalCost();
      const totalCostInINR = calculateTotalCostInINR();

      // Create license
      const licenseData = {
        client_id: selectedClientId || null,
        vendor_id: vendorId,
        vendor: vendorName.trim() || null,
        invoice_no: invoiceNo.trim() || null,
        tool_name: toolName.trim(),
        make: make.trim() || null,
        model: model.trim() || null,
        version: version.trim() || null,
        cost_per_user: parseFloat(costPerUser),
        quantity: parseInt(quantity),
        total_cost: totalCost,
        total_cost_inr: totalCostInINR,
        purchase_date: purchaseDate,
        expiration_date: expirationDate,
        currency_code: selectedCurrency,
        original_amount: totalCost
      };

      const licenseResponse = await fetch(`${getApiBaseUrl()}/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseData),
      });
      
      const licenseResult = await licenseResponse.json();
      
      if (!licenseResult.success) {
        throw new Error(licenseResult.error || 'Failed to create license purchase');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create license purchase');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {step === 1 ? 'Step 1: Client & Vendor Information' : 'Step 2: License Details'}
            </h2>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-green-500 text-white'
              }`}>
                1
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700" 
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              {/* Step 1: Client & License Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-700 dark:to-dark-700 rounded-xl p-6 border border-blue-100 dark:border-dark-600 space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center">
                  <span className="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
                  License Purchase Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="clientId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Client
                    </label>
                    <select
                      id="clientId"
                      value={selectedClientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                    >
                      <option value="">Select a client (optional)</option>
                      {clients && clients.length > 0 && clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="invoiceNo" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Invoice Number (Optional)
                    </label>
                    <input
                      id="invoiceNo"
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      placeholder="Enter invoice number"
                    />
                  </div>
                </div>

                {/* Client Information Fields - Auto-filled when client is selected */}
                {selectedClientId && (
                  <div className="bg-blue-50 dark:bg-dark-600 rounded-xl p-5 border border-blue-200 dark:border-blue-900/30">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Client Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Contact Person</label>
                        <input
                          type="text"
                          value={clientContactPerson}
                          onChange={(e) => setClientContactPerson(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Contact person"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={clientCompanyName}
                          onChange={(e) => setClientCompanyName(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Company name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Address</label>
                        <textarea
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          rows={2}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                          placeholder="Address"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">GST Treatment</label>
                        <input
                          type="text"
                          value={clientGstTreatment}
                          onChange={(e) => setClientGstTreatment(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="GST treatment"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Source of Supply</label>
                        <input
                          type="text"
                          value={clientSourceOfSupply}
                          onChange={(e) => setClientSourceOfSupply(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Source of supply"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">GST Number</label>
                        <input
                          type="text"
                          value={clientGst}
                          onChange={(e) => setClientGst(e.target.value.toUpperCase())}
                          maxLength={15}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase"
                          placeholder="GST number (15 digits)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Currency</label>
                        <select
                          value={clientCurrencyId}
                          onChange={(e) => setClientCurrencyId(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Select currency</option>
                          {currencies && currencies.length > 0 && currencies.map((currency) => (
                            <option key={currency.id} value={currency.id}>
                              {currency.code} - {currency.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="toolName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Tool Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="toolName"
                    type="text"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                    placeholder="Enter tool name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="make" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Make
                    </label>
                    <input
                      id="make"
                      type="text"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      placeholder="Enter make"
                    />
                  </div>

                  <div>
                    <label htmlFor="model" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Model
                    </label>
                    <input
                      id="model"
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      placeholder="Enter model"
                    />
                  </div>

                  <div>
                    <label htmlFor="version" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Version
                    </label>
                    <input
                      id="version"
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      placeholder="Enter version"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      required
                    >
                      {currencies && currencies.length > 0 ? (
                        currencies.map(currency => (
                          <option key={currency.id} value={currency.code}>
                            {currency.code} - {currency.name} ({currency.symbol})
                          </option>
                        ))
                      ) : (
                        <option value="">Loading currencies...</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="costPerUser" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Cost per User <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                        {getSelectedCurrencyData()?.symbol || '₹'}
                      </span>
                      <input
                        id="costPerUser"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costPerUser}
                        onChange={(e) => setCostPerUser(e.target.value)}
                        className="pl-10 block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Number of Licenses <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      placeholder="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="purchaseDate"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => {
                        setPurchaseDate(e.target.value);
                        const newPurchaseDate = new Date(e.target.value);
                        const currentExpiration = new Date(expirationDate);
                        if (currentExpiration < newPurchaseDate) {
                          setExpirationDate('');
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="expirationDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Expiration Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="expirationDate"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      min={purchaseDate}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Cost ({selectedCurrency}):</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {getSelectedCurrencyData()?.symbol || '₹'}{calculateTotalCost().toFixed(2)}
                      </span>
                    </div>
                    {selectedCurrency !== 'INR' && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-600">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Cost (INR):</span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{calculateTotalCostInINR().toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-600">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Vendor Information */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-dark-700 dark:to-dark-700 rounded-xl p-6 border border-purple-100 dark:border-dark-600 space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center">
                  <span className="w-2 h-8 bg-purple-600 rounded-full mr-3"></span>
                  Vendor Information
                </h3>
                
                {/* Vendor Selection Dropdown */}
                <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <label htmlFor="selectVendor" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Select Existing Vendor (Optional)
                  </label>
                  <select
                    id="selectVendor"
                    value={selectedVendorId}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                    className="block w-full rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                  >
                    <option value="">-- Select a vendor or enter new details below --</option>
                    {vendors && vendors.length > 0 && vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} {vendor.company_name ? `(${vendor.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    💡 Select a vendor to auto-fill all fields below, or enter new vendor details manually
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="vendorName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="vendorName"
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorContactPerson" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Contact Person
                    </label>
                    <input
                      id="vendorContactPerson"
                      type="text"
                      value={vendorContactPerson}
                      onChange={(e) => setVendorContactPerson(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="Enter contact person"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Email Address
                    </label>
                    <input
                      id="vendorEmail"
                      type="email"
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorPhone" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="vendorPhone"
                      type="tel"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="+91 1234567890"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="vendorCompanyName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Company Name
                    </label>
                    <input
                      id="vendorCompanyName"
                      type="text"
                      value={vendorCompanyName}
                      onChange={(e) => setVendorCompanyName(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="Company name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="vendorAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Address
                    </label>
                    <textarea
                      id="vendorAddress"
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all resize-none"
                      rows={3}
                      placeholder="Complete address with city, state, and postal code"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorGstTreatment" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      GST Treatment
                    </label>
                    <select
                      id="vendorGstTreatment"
                      value={vendorGstTreatment}
                      onChange={(e) => setVendorGstTreatment(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                    >
                      <option value="">Select GST treatment</option>
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

                  <div>
                    <label htmlFor="vendorSourceOfSupply" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Source of Supply
                    </label>
                    <input
                      id="vendorSourceOfSupply"
                      type="text"
                      value={vendorSourceOfSupply}
                      onChange={(e) => setVendorSourceOfSupply(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="Enter source of supply"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorGst" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      GST Number
                    </label>
                    <input
                      id="vendorGst"
                      type="text"
                      value={vendorGst}
                      onChange={(e) => setVendorGst(e.target.value.toUpperCase())}
                      maxLength={15}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all uppercase"
                      placeholder="Enter GST number (15 digits)"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorCurrency" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Currency
                    </label>
                    <select
                      id="vendorCurrency"
                      value={vendorCurrencyId}
                      onChange={(e) => setVendorCurrencyId(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                    >
                      <option value="">Select currency</option>
                      {currencies && currencies.length > 0 && currencies.map(currency => (
                        <option key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vendorModeOfPayment" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Mode of Payment
                    </label>
                    <input
                      id="vendorModeOfPayment"
                      type="text"
                      value={vendorModeOfPayment}
                      onChange={(e) => setVendorModeOfPayment(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="e.g., Bank Transfer, Credit Card"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Amount
                    </label>
                    <input
                      id="vendorAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={vendorAmount}
                      onChange={(e) => setVendorAmount(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorQuantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Quantity
                    </label>
                    <input
                      id="vendorQuantity"
                      type="number"
                      min="0"
                      value={vendorQuantity}
                      onChange={(e) => setVendorQuantity(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/20 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-dark-600">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-semibold"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white py-3 px-8 rounded-xl hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 font-semibold"
                >
                  <span>{loading ? 'Creating...' : 'Create License'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default MultiStepLicenseForm;
