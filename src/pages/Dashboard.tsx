import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Dice1 as License,
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
} from "lucide-react";
import { format, addMonths, isBefore, differenceInMonths, isAfter } from "date-fns";
import { api } from '../lib/api';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';

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
  currency_code: string;
  purchase_date: string;
  expiration_date: string;
  client?: {
    name: string;
  };
}

interface DashboardStats {
  activeLicenses: number;
  expiredLicenses: number;
  totalLicenses: number;
  totalSpentINR: number;
  totalSpentUSD: number;
  expiringCount: number;
  monthlyData: Array<{
    month: string;
    licenses: number;
    spentINR: number;
    spentUSD: number;
  }>;
}

interface VendorStats {
  vendor: string;
  totalCostINR: number;
  totalCostUSD: number;
  licenseCount: number;
  activeLicenseCount: number;
}

interface ProjectionStats {
  monthlySpendINR: number;
  monthlySpendUSD: number;
  projectedAnnualINR: number;
  projectedAnnualUSD: number;
  activeToolCount: number;
  totalToolCount: number;
  vendorDistribution: VendorStats[];
}

interface LicenseStatusData {
  name: string;
  value: number;
  color: string;
}

interface KeyMetrics {
  name: string;
  value: number;
  change: number;
  currency?: string;
  description?: string;
}

interface ExchangeRates {
  USD: number;
  AED: number;
  INR: number;
  [key: string]: number;
}

const COLORS = [
  "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", 
  "#F43F5E", "#F97316", "#84CC16", "#14B8A6", "#06B6D4", "#94A3B8"
];

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeLicenses: 0,
    expiredLicenses: 0,
    totalLicenses: 0,
    totalSpentINR: 0,
    totalSpentUSD: 0,
    expiringCount: 0,
    monthlyData: [],
  });
  const [projections, setProjections] = useState<ProjectionStats>({
    monthlySpendINR: 0,
    monthlySpendUSD: 0,
    projectedAnnualINR: 0,
    projectedAnnualUSD: 0,
    activeToolCount: 0,
    totalToolCount: 0,
    vendorDistribution: [],
  });
  const [licenseStatusData, setLicenseStatusData] = useState<LicenseStatusData[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<LicensePurchase[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 0.012, // 1 INR = 0.012 USD (approximate)
    AED: 0.044, // 1 INR = 0.044 AED (approximate)
    INR: 1
  });

  useEffect(() => {
    fetchExchangeRates();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (purchases.length > 0) {
      processData();
      processLicenseStatusData();
      calculateProjections(purchases);
    }
  }, [purchases, exchangeRates]);

  useEffect(() => {
    if (stats.totalLicenses > 0) {
      processKeyMetrics();
    }
  }, [stats, purchases, exchangeRates]);

  // Fetch live exchange rates - FIXED VERSION
  const fetchExchangeRates = async () => {
    try {
      // Using a more reliable exchange rate API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data && data.rates) {
        setExchangeRates({
          USD: 1, // 1 USD = 1 USD
          AED: data.rates.AED || 3.67, // 1 USD = 3.67 AED (fallback)
          INR: data.rates.INR || 83.0, // 1 USD = 83 INR (fallback)
        });
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates, using defaults:', error);
      // Fallback rates (1 USD = 83 INR, 1 USD = 3.67 AED)
      setExchangeRates({
        USD: 1,
        AED: 3.67,
        INR: 83.0
      });
    }
  };

  // Helper function to check if license is active
  const isLicenseActive = (expirationDate: string): boolean => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    return isAfter(expDate, now);
  };

  // Helper function to check if license is expiring soon (within 30 days)
  const isLicenseExpiringSoon = (expirationDate: string): boolean => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const thirtyDaysFromNow = addMonths(now, 1);
    
    return isAfter(expDate, now) && isBefore(expDate, thirtyDaysFromNow);
  };

  // Helper function to check if license is already expired
  const isLicenseExpired = (expirationDate: string): boolean => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    return isBefore(expDate, now);
  };

  // Helper function to calculate total cost in base currency (INR) - FIXED VERSION
  const calculateTotalCostINR = (purchase: LicensePurchase): number => {
    // If we already have INR value, use it
    if (purchase.total_cost_inr && purchase.total_cost_inr > 0) {
      return purchase.total_cost_inr;
    }

    const currency = purchase.currency_code?.toUpperCase() || 'USD';
    const originalTotal = purchase.total_cost || (purchase.cost_per_user * purchase.quantity);
    
    // Convert to INR based on original currency
    if (currency === 'INR') {
      return originalTotal;
    } else if (currency === 'USD') {
      return originalTotal * exchangeRates.INR; // USD to INR
    } else if (currency === 'AED') {
      // Convert AED to USD first, then USD to INR
      const usdAmount = originalTotal / exchangeRates.AED;
      return usdAmount * exchangeRates.INR;
    } else {
      // For other currencies, assume USD conversion
      return originalTotal * exchangeRates.INR;
    }
  };

  // Helper function to convert INR to other currencies - FIXED VERSION
  const convertFromINR = (amountINR: number, targetCurrency: string): number => {
    const currency = targetCurrency.toUpperCase();
    
    if (currency === 'INR') return amountINR;
    if (currency === 'USD') return amountINR / exchangeRates.INR; // INR to USD
    if (currency === 'AED') {
      // Convert INR to USD first, then USD to AED
      const usdAmount = amountINR / exchangeRates.INR;
      return usdAmount * exchangeRates.AED;
    }
    
    return amountINR / exchangeRates.INR; // Default to USD conversion
  };

  const processData = () => {
    const now = new Date();

    const newStats: DashboardStats = {
      activeLicenses: 0,
      expiredLicenses: 0,
      totalLicenses: 0,
      totalSpentINR: 0,
      totalSpentUSD: 0,
      expiringCount: 0,
      monthlyData: [],
    };

    const monthlyMap = new Map<
      string,
      { licenses: number; spentINR: number; spentUSD: number }
    >();

    purchases.forEach((purchase) => {
      const purchaseDate = new Date(purchase.purchase_date);
      const totalCostINR = calculateTotalCostINR(purchase);
      const totalCostUSD = convertFromINR(totalCostINR, 'USD');

      // Calculate license status
      const isActive = isLicenseActive(purchase.expiration_date);
      const isExpiringSoon = isLicenseExpiringSoon(purchase.expiration_date);
      const isExpired = isLicenseExpired(purchase.expiration_date);

      // Always add to total investment (including expired licenses)
      newStats.totalSpentINR += totalCostINR;
      newStats.totalSpentUSD += totalCostUSD;

      if (isActive) {
        newStats.activeLicenses += purchase.quantity;
        
        if (isExpiringSoon) {
          newStats.expiringCount += purchase.quantity;
        }
      } else if (isExpired) {
        newStats.expiredLicenses += purchase.quantity;
      }

      newStats.totalLicenses += purchase.quantity;

      // Monthly data (all purchases)
      const monthKey = format(purchaseDate, "MMM yyyy");
      const monthData = monthlyMap.get(monthKey) || {
        licenses: 0,
        spentINR: 0,
        spentUSD: 0,
      };
      
      monthData.licenses += purchase.quantity;
      monthData.spentINR += totalCostINR;
      monthData.spentUSD += totalCostUSD;
      
      monthlyMap.set(monthKey, monthData);
    });

    newStats.monthlyData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);

    setStats(newStats);
  };

  const calculateProjections = (purchases: LicensePurchase[]) => {
    const now = new Date();
    const activeTools = new Set<string>();
    const allTools = new Set<string>();
    const vendorMap = new Map<string, VendorStats>();

    let totalMonthlyINR = 0;
    let totalMonthlyUSD = 0;

    purchases.forEach((purchase) => {
      const expirationDate = new Date(purchase.expiration_date);
      const totalCostINR = calculateTotalCostINR(purchase);
      const totalCostUSD = convertFromINR(totalCostINR, 'USD');
      const isActive = isLicenseActive(purchase.expiration_date);

      const toolKey = `${purchase.tool_name}-${purchase.vendor}`;
      allTools.add(toolKey);

      if (isActive) {
        activeTools.add(toolKey);

        const remainingMonths = Math.max(differenceInMonths(expirationDate, now), 1);
        
        totalMonthlyINR += totalCostINR / remainingMonths;
        totalMonthlyUSD += totalCostUSD / remainingMonths;
      }

      // Update vendor stats (include all purchases)
      // Use tool_name if vendor is not specified
      const vendorName = purchase.vendor || purchase.tool_name || 'Unknown Vendor';
      const vendorStats = vendorMap.get(vendorName) || {
        vendor: vendorName,
        totalCostINR: 0,
        totalCostUSD: 0,
        licenseCount: 0,
        activeLicenseCount: 0,
      };

      vendorStats.totalCostINR += totalCostINR;
      vendorStats.totalCostUSD += totalCostUSD;
      vendorStats.licenseCount += purchase.quantity;
      
      if (isActive) {
        vendorStats.activeLicenseCount += purchase.quantity;
      }
      
      vendorMap.set(vendorName, vendorStats);
    });

    const sortedVendors = Array.from(vendorMap.values()).sort(
      (a, b) => b.totalCostINR - a.totalCostINR,
    );

    setProjections({
      monthlySpendINR: totalMonthlyINR,
      monthlySpendUSD: totalMonthlyUSD,
      projectedAnnualINR: totalMonthlyINR * 12,
      projectedAnnualUSD: totalMonthlyUSD * 12,
      activeToolCount: activeTools.size,
      totalToolCount: allTools.size,
      vendorDistribution: sortedVendors,
    });
  };

  const processLicenseStatusData = () => {
    let activeTools = 0;
    let expiredTools = 0;

    purchases.forEach((purchase) => {
      const isActive = isLicenseActive(purchase.expiration_date);
      if (isActive) {
        activeTools++;
      } else {
        expiredTools++;
      }
    });

    setLicenseStatusData([
      { name: "Active Tools", value: activeTools, color: "#10B981" },
      { name: "Expired Tools", value: expiredTools, color: "#EF4444" },
    ]);
  };

  const processKeyMetrics = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // Calculate recent purchases (last 3 months vs previous 3 months)
    let recentSpendINR = 0;
    let previousSpendINR = 0;
    let recentSpendUSD = 0;
    let previousSpendUSD = 0;
    let recentLicenseCount = 0;
    let previousLicenseCount = 0;

    // Calculate vendor growth
    const recentVendors = new Set<string>();
    const previousVendors = new Set<string>();

    purchases.forEach((purchase) => {
      const purchaseDate = new Date(purchase.purchase_date);
      const totalCostINR = calculateTotalCostINR(purchase);
      const totalCostUSD = convertFromINR(totalCostINR, 'USD');

      if (purchaseDate >= threeMonthsAgo) {
        recentSpendINR += totalCostINR;
        recentSpendUSD += totalCostUSD;
        recentLicenseCount += purchase.quantity;
        recentVendors.add(purchase.vendor);
      } else if (purchaseDate >= sixMonthsAgo && purchaseDate < threeMonthsAgo) {
        previousSpendINR += totalCostINR;
        previousSpendUSD += totalCostUSD;
        previousLicenseCount += purchase.quantity;
        previousVendors.add(purchase.vendor);
      }
    });

    // Calculate changes
    const spendingChangeINR = previousSpendINR > 0 
      ? ((recentSpendINR - previousSpendINR) / previousSpendINR) * 100 
      : recentSpendINR > 0 ? 100 : 0;

    const spendingChangeUSD = previousSpendUSD > 0 
      ? ((recentSpendUSD - previousSpendUSD) / previousSpendUSD) * 100 
      : recentSpendUSD > 0 ? 100 : 0;

    const vendorGrowth = previousVendors.size > 0
      ? ((recentVendors.size - previousVendors.size) / previousVendors.size) * 100
      : recentVendors.size > 0 ? 100 : 0;

    const activeRate = stats.totalLicenses > 0
      ? (stats.activeLicenses / stats.totalLicenses) * 100
      : 0;

    const expirationRate = stats.totalLicenses > 0
      ? (stats.expiredLicenses / stats.totalLicenses) * 100
      : 0;

    const avgLicenseCostINR = stats.totalLicenses > 0
      ? stats.totalSpentINR / stats.totalLicenses
      : 0;

    const avgLicenseCostUSD = stats.totalLicenses > 0
      ? stats.totalSpentUSD / stats.totalLicenses
      : 0;

    const metrics: KeyMetrics[] = [
      {
        name: "Total Investment",
        value: stats.totalSpentINR,
        change: 0,
        currency: "INR",
        description: `All purchases (${stats.totalLicenses} licenses) - USD: ${formatCurrencyUtil(stats.totalSpentUSD, "USD")}`
      },
      {
        name: "Active License Rate",
        value: activeRate,
        change: 0,
        description: `${stats.activeLicenses} / ${stats.totalLicenses} licenses active`
      },
      {
        name: "Recent Spending Trend",
        value: recentSpendINR,
        change: spendingChangeINR,
        currency: "INR",
        description: `Last 3 months (${recentLicenseCount} licenses) - USD: ${formatCurrencyUtil(recentSpendUSD, "USD")}`
      },
      {
        name: "Vendor Diversity",
        value: recentVendors.size,
        change: vendorGrowth,
        description: `Active vendors: ${recentVendors.size}`
      },
      {
        name: "Expiration Rate",
        value: expirationRate,
        change: 0,
        description: `${stats.expiredLicenses} expired licenses`
      },
      {
        name: "Avg License Cost",
        value: avgLicenseCostINR,
        change: 0,
        currency: "INR",
        description: `Per license - USD: ${formatCurrencyUtil(avgLicenseCostUSD, "USD")}`
      }
    ];

    setKeyMetrics(metrics);
  };

  const fetchDashboardData = async () => {
    try {
      console.log("Fetching dashboard data...");
      const { data, error } = await api.from("license_purchases").select(`
        *,
        client:clients(name)
      `);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Fetched purchases:", data);
      setPurchases(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.vendor}</p>
          <p className="text-sm text-gray-600">
            Total Investment: {formatCurrencyUtil(data.totalCostINR, "INR")}
          </p>
          <p className="text-sm text-gray-600">
            USD: {formatCurrencyUtil(data.totalCostUSD, "USD")}
          </p>
          <p className="text-sm text-gray-600">Total Licenses: {data.licenseCount}</p>
          <p className="text-sm text-gray-600">Active Licenses: {data.activeLicenseCount}</p>
          <p className="text-sm text-gray-600">
            Share: {stats.totalSpentINR > 0 ? ((data.totalCostINR / stats.totalSpentINR) * 100).toFixed(1) : 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  const LicenseStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalTools = licenseStatusData.reduce((sum, item) => sum + item.value, 0);
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Count: {data.value}</p>
          <p className="text-sm text-gray-600">
            Percentage: {totalTools > 0 ? ((data.value / totalTools) * 100).toFixed(1) : 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  const KeyMetricsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metric = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{metric.name}</p>
          <p className="text-sm text-gray-600">
            Value: {metric.currency ? formatCurrencyUtil(metric.value, metric.currency) : metric.value.toFixed(1)}
            {!metric.currency && (metric.name.includes('Rate') || metric.name.includes('Diversity')) && '%'}
          </p>
          {metric.description && (
            <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
          )}
          {metric.change !== 0 && (
            <p className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Change: {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Debug info */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        {/* <p className="text-sm text-yellow-800">
          Debug: {purchases.length} purchases | Total: {stats.totalLicenses} | 
          Active: {stats.activeLicenses} | Expired: {stats.expiredLicenses} |
          Expiring Soon: {stats.expiringCount}
        </p> */}
        {/* <p className="text-sm text-yellow-800">
          Total Investment: {formatCurrencyUtil(stats.totalSpentINR, "INR")} | {formatCurrencyUtil(stats.totalSpentUSD, "USD")}
        </p> */}
        <p className="text-sm text-yellow-800">
          Exchange Rates: 1 USD = {exchangeRates.INR.toFixed(2)} INR | 1 USD = {exchangeRates.AED.toFixed(2)} AED
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <License className="h-10 w-10 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Licenses</p>
              <p className="text-2xl font-semibold">{stats.totalLicenses}</p>
              <p className="text-xs text-gray-500">
                Active: {stats.activeLicenses} | Expired: {stats.expiredLicenses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <IndianRupee className="h-10 w-10 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Investment</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyUtil(stats.totalSpentINR, "INR")}
              </p>
              <p className="text-xs text-gray-500">
                All purchases (₹{stats.totalSpentINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Clock className="h-10 w-10 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-semibold">{stats.expiringCount}</p>
              <p className="text-xs text-gray-500">Within 30 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Users className="h-10 w-10 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Avg. Cost/License</p>
              <p className="text-2xl font-semibold">
                {stats.totalLicenses > 0
                  ? formatCurrencyUtil(stats.totalSpentINR / stats.totalLicenses, "INR")
                  : "₹0"}
              </p>
              <p className="text-xs text-gray-500">
                Per license average
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            License Status Overview
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={licenseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {licenseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<LicenseStatusTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Key Performance Metrics (All Purchases)
          </h2>
          <div className="space-y-4">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-gray-600 block">{metric.name}</span>
                    {metric.description && (
                      <span className="text-xs text-gray-400">{metric.description}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">
                      {metric.currency 
                        ? formatCurrencyUtil(metric.value, metric.currency)
                        : metric.value.toFixed(1)}
                      {!metric.currency && (metric.name.includes('Rate') || metric.name.includes('Diversity')) && '%'}
                    </div>
                    {metric.change !== 0 && (
                      <div
                        className={`text-sm ${
                          metric.change > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {metric.change > 0 ? "↑" : "↓"}{" "}
                        {Math.abs(metric.change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
                {metric.change !== 0 && (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        metric.change > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(metric.change), 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rest of the components remain the same */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold ml-2">
            Real-time Cost Projections (Active Licenses Only)
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Monthly Spend</p>
            <p className="text-xl font-semibold text-blue-700">
              {formatCurrencyUtil(projections.monthlySpendINR, "INR")}
            </p>
            <p className="text-sm text-gray-500">
              {formatCurrencyUtil(projections.monthlySpendUSD, "USD")}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Projected Annual</p>
            <p className="text-xl font-semibold text-green-700">
              {formatCurrencyUtil(projections.projectedAnnualINR, "INR")}
            </p>
            <p className="text-sm text-gray-500">
              {formatCurrencyUtil(projections.projectedAnnualUSD, "USD")}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Active Tools</p>
            <p className="text-xl font-semibold text-purple-700">
              {projections.activeToolCount}
            </p>
            <p className="text-sm text-gray-500">
              Total: {projections.totalToolCount}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg. Monthly/Tool</p>
            <p className="text-xl font-semibold text-yellow-700">
              {projections.activeToolCount > 0
                ? formatCurrencyUtil(
                    projections.monthlySpendINR / projections.activeToolCount,
                    "INR",
                  )
                : "₹0"}
            </p>
            <p className="text-sm text-gray-500">
              {projections.activeToolCount > 0
                ? formatCurrencyUtil(
                    projections.monthlySpendUSD / projections.activeToolCount,
                    "USD",
                  )
                : "$0"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Monthly Investment (INR) - All Purchases
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString("en-IN")}`,
                    "Investment",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="spentINR"
                  name="Monthly Investment"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Vendor Investment Distribution (All Purchases)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projections.vendorDistribution}
                  dataKey="totalCostINR"
                  nameKey="vendor"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ vendor, totalCostINR }) => 
                    `${vendor}: ${formatCurrencyUtil(totalCostINR, "INR")}`
                  }
                >
                  {projections.vendorDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Vendor-wise Investment Details (All Purchases)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Investment (INR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Investment (USD)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Licenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Licenses
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projections.vendorDistribution.map((vendor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">
                        {vendor.vendor}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrencyUtil(vendor.totalCostINR, "INR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrencyUtil(vendor.totalCostUSD, "USD")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.totalSpentINR > 0
                      ? ((vendor.totalCostINR / stats.totalSpentINR) * 100).toFixed(1)
                      : "0.0"}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.licenseCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.activeLicenseCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
