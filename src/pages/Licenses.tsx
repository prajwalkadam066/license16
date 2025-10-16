import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, ArrowUpDown, ChevronLeft, ChevronRight, X, Calendar, IndianRupee, Tag, Building, Users, User } from 'lucide-react';
import MultiStepLicenseForm from '../components/MultiStepLicenseForm';
import ManageLicenseModal from '../components/ManageLicenseModal';
import { differenceInDays, format, parseISO } from 'date-fns';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { getApiBaseUrl } from '../utils/api';
import { getSession } from '../utils/session';
import { hasPermission, PERMISSIONS, getRoleDisplayName, getRoleBadgeColor } from '../utils/accessControl';
import DualCurrencyDisplay from '../components/DualCurrencyDisplay';

interface LicensePurchase {
  id: string;
  serial_no: string;
  client_id: string;
  invoice_no: string;
  tool_name: string;
  make: string;
  model: string;
  version: string;
  vendor: string;
  cost_per_user: number;
  quantity: number;
  total_cost: number;
  total_cost_inr: number;
  currency_code?: string; // Currency used for cost_per_user
  purchase_date: string;
  expiration_date: string;
  client_name?: string; // Client name from API join
  client?: {
    name: string;
  };
}

interface FilterState {
  vendors: string[];
  status: string[];
  priceRange: {
    min: number;
    max: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

type SortField = keyof LicensePurchase;
type SortOrder = 'asc' | 'desc';

function Licenses() {
  const [purchases, setPurchases] = useState<LicensePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  
  // Access control
  const canManageAllLicenses = hasPermission(userSession?.role, PERMISSIONS.MANAGE_ALL_LICENSES);
  const canViewTeamLicenses = hasPermission(userSession?.role, PERMISSIONS.VIEW_TEAM_LICENSES);
  const canViewOwnLicenses = hasPermission(userSession?.role, PERMISSIONS.VIEW_OWN_LICENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('tool_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    vendors: [],
    status: [],
    priceRange: {
      min: 0,
      max: 0
    },
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Derived state
  const uniqueVendors = useMemo(() => {
    const vendors = new Set(purchases.map(p => p.vendor).filter(Boolean));
    return Array.from(vendors).sort();
  }, [purchases]);

  const maxPrice = useMemo(() => {
    if (purchases.length === 0) return 0;
    return Math.max(...purchases.map(p => p.total_cost_inr || parseFloat(String((p as any).total_cost || 0))));
  }, [purchases]);

  const fetchLicensePurchases = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/licenses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch licenses');
      }
      
      const data = result.data || [];
      setPurchases(data);

      // Initialize price range filter with actual data
      if (data && data.length > 0) {
        const prices = data.map((p: any) => p.total_cost_inr || 0);
        setFilters(prev => ({
          ...prev,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user session for role-based UI
    const session = getSession();
    setUserSession(session);
    fetchLicensePurchases();
  }, []);

  const handleManage = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setIsManageModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getLicenseStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expDate, today);

    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 30) {
      return 'expiring-soon';
    }
    return 'active';
  };

  const applyFilters = (data: LicensePurchase[]) => {
    return data.filter(purchase => {
      // Search term filter with null safety
      const searchMatch = 
        (purchase.tool_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (!searchMatch && searchTerm) return false;

      // Vendor filter
      if (filters.vendors.length > 0 && purchase.vendor && !filters.vendors.includes(purchase.vendor)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const expirationDate = purchase.expiration_date || (purchase as any).expiry_date;
        if (expirationDate) {
          const status = getLicenseStatus(expirationDate);
          if (!filters.status.includes(status)) {
            return false;
          }
        }
      }

      // Price range filter
      const totalCost = purchase.total_cost_inr || parseFloat(String((purchase as any).total_cost || 0));
      if (totalCost < filters.priceRange.min || 
          totalCost > filters.priceRange.max) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const purchaseDate = new Date(purchase.purchase_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (purchaseDate < startDate || purchaseDate > endDate) {
          return false;
        }
      }

      return true;
    });
  };

  const sortData = (data: LicensePurchase[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
  };

  const filteredPurchases = useMemo(() => applyFilters(purchases), [purchases, searchTerm, filters]);
  const sortedPurchases = useMemo(() => sortData(filteredPurchases), [filteredPurchases, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPurchases.slice(indexOfFirstItem, indexOfLastItem);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 ml-1 text-blue-600" /> : 
      <ArrowUpDown className="h-4 w-4 ml-1 text-blue-600 transform rotate-180" />;
  };

  const renderTableHeader = (field: SortField, label: string) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 whitespace-nowrap transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

  const getRowClassName = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-gray-100 dark:bg-dark-700 opacity-60';
      case 'expiring-soon':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-dark-700';
    }
  };

  const getExpirationText = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expDate, today);

    if (daysUntilExpiration < 0) {
      const daysExpired = Math.abs(daysUntilExpiration);
      return `Expired ${daysExpired} days ago`;
    } else if (daysUntilExpiration <= 30) {
      return `Expires in ${daysUntilExpiration} days`;
    }
    return format(parseISO(expirationDate), 'MMM d, yyyy');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.vendors.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateRange.start && filters.dateRange.end) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < maxPrice) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      vendors: [],
      status: [],
      priceRange: {
        min: 0,
        max: maxPrice
      },
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  return (
  <div className="space-y-6 mt-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Licenses</h1>
          <div className="flex gap-2">
            {canManageAllLicenses ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                <Users className="h-4 w-4 mr-1" />
                All Licenses (Admin)
              </span>
            ) : canViewTeamLicenses ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <Users className="h-4 w-4 mr-1" />
                Team Licenses (Scrum Master)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <User className="h-4 w-4 mr-1" />
                My Licenses (Member)
              </span>
            )}
          </div>
        </div>
        {(canManageAllLicenses || canViewTeamLicenses) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New License
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-4 py-2 border dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors relative"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-4 p-4 border dark:border-dark-600 rounded-lg bg-gray-50 dark:bg-dark-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vendor Filter */}
                <div>
                  <label htmlFor="vendor-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="h-4 w-4 inline-block mr-1" />
                    Vendor
                  </label>
                  <select
                    id="vendor-filter"
                    multiple
                    value={filters.vendors}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, vendors: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by vendor"
                  >
                    {uniqueVendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="h-4 w-4 inline-block mr-1" />
                    Status
                  </label>
                  <select
                    id="status-filter"
                    multiple
                    value={filters.status}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, status: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by status"
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <IndianRupee className="h-4 w-4 inline-block mr-1" />
                    Price Range (INR)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label htmlFor="purchase-date-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Purchase Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="purchase-date-start"
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                      aria-label="Start date"
                    />
                    <input
                      id="purchase-date-end"
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.vendors.map(vendor => (
                    <span key={vendor} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {vendor}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          vendors: prev.vendors.filter(v => v !== vendor)
                        }))}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label={`Remove ${vendor} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.status.map(status => (
                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {status}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          status: prev.status.filter(s => s !== status)
                        }))}
                        className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                        aria-label={`Remove ${status} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {(filters.dateRange.start && filters.dateRange.end) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {`${format(new Date(filters.dateRange.start), 'MMM d, yyyy')} - ${format(new Date(filters.dateRange.end), 'MMM d, yyyy')}`}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          dateRange: { start: '', end: '' }
                        }))}
                        className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                        aria-label="Remove date range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  {renderTableHeader('serial_no', 'Serial No')}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client Name
                  </th>
                  {renderTableHeader('tool_name', 'Tool Name')}
                  {renderTableHeader('vendor', 'Vendor')}
                  {renderTableHeader('make', 'Make')}
                  {renderTableHeader('model', 'Model')}
                  {renderTableHeader('version', 'Version')}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice No
                  </th>
                  {renderTableHeader('cost_per_user', 'Cost per User')}
                  {renderTableHeader('quantity', 'Licenses')}
                  {renderTableHeader('total_cost_inr', 'Total Cost')}
                  {renderTableHeader('purchase_date', 'Purchase Date')}
                  {renderTableHeader('expiration_date', 'Expiration Date')}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <span className="ml-2">Loading licenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No licenses found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((purchase) => {
                    const status = getLicenseStatus(purchase.expiration_date);
                    return (
                      <tr key={purchase.id} className={getRowClassName(status)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                          {purchase.serial_no || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {purchase.client_id ? (
                            <Link 
                              to={`/clients/${purchase.client_id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            >
                              {purchase.client_name || purchase.client?.name || 'No Client'}
                            </Link>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">No Client</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {purchase.tool_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.vendor || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.make || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.model || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.version || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.invoice_no || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            // Always show cost per user in original currency
                            const currency = purchase.currency_code || 'INR';
                            return formatCurrencyUtil(purchase.cost_per_user, currency);
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DualCurrencyDisplay 
                            amount={purchase.total_cost || (purchase.cost_per_user * purchase.quantity)}
                            currency={purchase.currency_code || 'INR'}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(purchase.purchase_date), 'MMM d, yyyy')}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          status === 'expired' ? 'text-gray-500 dark:text-gray-400' :
                          status === 'expiring-soon' ? 'text-red-600 dark:text-red-400 font-medium' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {getExpirationText(purchase.expiration_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => handleManage(purchase.id)}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                            aria-label={`Manage license for ${purchase.tool_name}`}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, sortedPurchases.length)}
                  </span>{' '}
                  of <span className="font-medium">{sortedPurchases.length}</span> results
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MultiStepLicenseForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchLicensePurchases}
      />

      <ManageLicenseModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedPurchaseId(null);
        }}
        purchaseId={selectedPurchaseId || ''}
        onSuccess={fetchLicensePurchases}
      />
    </div>
  );
}

export default Licenses;