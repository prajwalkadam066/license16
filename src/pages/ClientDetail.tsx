import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Package,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import { format } from "date-fns";
import SimpleCurrencyDisplay from "../components/SimpleCurrencyDisplay";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

interface License {
  id: string;
  tool_name: string;
  tool_description: string;
  tool_vendor: string;
  purchase_date: string;
  expiry_date: string;
  number_of_users: number;
  cost_per_user: number;
  total_cost: number;
  total_cost_inr: number;
  currency_code: string;
  currency_symbol: string;
  status: string;
}

interface ClientData {
  client: Client;
  licenses: License[];
  stats: {
    total_licenses: number;
    active_licenses: number;
    expired_licenses: number;
    total_cost: number;
  };
}

function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/clients/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch client details");
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch client details"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "expired":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "cancelled":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading client details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 mt-5">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error || "Client not found"}
        </div>
      </div>
    );
  }

  const { client, licenses, stats } = data;

  return (
    <div className="space-y-6 mt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {client.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Client since {format(new Date(client.created_at), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.phone && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4 mr-2" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 mr-2" />
              <span>{client.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Licenses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_licenses}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.active_licenses}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.expired_licenses}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Cost
              </p>
              <SimpleCurrencyDisplay 
                inrAmount={Number(stats.total_cost)} 
                className="mt-1"
              />
            </div>
            <IndianRupee className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-dark-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            License Purchases
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product/Tool
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Purchase Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {licenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No licenses found for this client
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr
                    key={license.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {license.tool_name || "N/A"}
                      </div>
                      {license.tool_description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {license.tool_description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {license.tool_vendor || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {format(new Date(license.purchase_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {format(new Date(license.expiry_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {license.number_of_users}
                    </td>
                    <td className="px-4 py-3">
                      <SimpleCurrencyDisplay 
                        inrAmount={Number(license.total_cost_inr)} 
                        originalAmount={Number(license.total_cost)}
                        originalCurrency={license.currency_code}
                        className="text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          license.status
                        )}`}
                      >
                        {getStatusIcon(license.status)}
                        <span className="ml-1 capitalize">{license.status}</span>
                      </span>
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

export default ClientDetail;
