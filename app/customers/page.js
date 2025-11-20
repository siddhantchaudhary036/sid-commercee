"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  Target,
} from "lucide-react";

import { CustomerTable, Pagination, AddCustomerModal } from "./components";
import Sidebar from "../components/Sidebar";

export default function CustomersPage() {
  const { user } = useUser();
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedChurnRisk, setSelectedChurnRisk] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 50;

  // Get Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  // Fetch data
  const stats = useQuery(
    api.customers.getStats,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const segmentDistribution = useQuery(
    api.customers.getSegmentDistribution,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const insights = useQuery(
    api.customers.getInsights,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const customersData = useQuery(
    api.customers.listWithFilters,
    convexUser
      ? {
          userId: convexUser._id,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          searchTerm: searchTerm || undefined,
          segment: selectedSegment || undefined,
          state: selectedState || undefined,
          churnRisk: selectedChurnRisk || undefined,
        }
      : "skip"
  );

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Customers</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-80"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedSegment || selectedState || selectedChurnRisk) && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                    {[selectedSegment, selectedState, selectedChurnRisk].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => {
                  setSelectedSegment("");
                  setSelectedState("");
                  setSelectedChurnRisk("");
                }}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  RFM Segment
                </label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Segments</option>
                  <option value="Champions">Champions</option>
                  <option value="Loyal">Loyal</option>
                  <option value="Potential">Potential</option>
                  <option value="At-Risk">At-Risk</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All States</option>
                  <option value="CA">California</option>
                  <option value="TX">Texas</option>
                  <option value="NY">New York</option>
                  <option value="FL">Florida</option>
                  <option value="IL">Illinois</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Churn Risk
                </label>
                <select
                  value={selectedChurnRisk}
                  onChange={(e) => setSelectedChurnRisk(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Overview */}
        {showAnalytics && (
          <AnalyticsOverview
            stats={stats}
            segmentDistribution={segmentDistribution}
            insights={insights}
            onCollapse={() => setShowAnalytics(false)}
          />
        )}

        {!showAnalytics && (
          <button
            onClick={() => setShowAnalytics(true)}
            className="mb-6 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ChevronDown className="w-4 h-4" />
            Show Analytics
          </button>
        )}

        {/* Customer Table */}
        <CustomerTable
          customers={customers}
          expandedRow={expandedRow}
          setExpandedRow={setExpandedRow}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCustomers={totalCustomers}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          userId={convexUser._id}
          onClose={() => setShowAddModal(false)}
        />
      )}
      </div>
    </div>
  );
}

// Analytics Overview Component
function AnalyticsOverview({ stats, segmentDistribution, insights, onCollapse }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Analytics Overview</h2>
        <button onClick={onCollapse} className="text-xs text-gray-500 hover:text-gray-700">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Customers"
          value={stats?.totalCustomers?.toLocaleString() || "0"}
          change="+12%"
          trend="up"
          subtitle="vs last month"
          icon={Users}
        />
        <KPICard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
          change="+8.5%"
          trend="up"
          subtitle="vs last month"
          icon={DollarSign}
        />
        <KPICard
          title="Avg LTV"
          value={`$${Math.round(stats?.avgLifetimeValue || 0)}`}
          change="+5.2%"
          trend="up"
          subtitle="vs avg"
          icon={Target}
        />
        <KPICard
          title="Churn Risk"
          value={`${stats?.atRiskCustomers || 0} customers`}
          change="High: 12.5%"
          trend="warning"
          subtitle=""
          icon={AlertTriangle}
        />
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SegmentChart data={segmentDistribution} />
        <RevenueChart data={segmentDistribution} />
        <InsightCards insights={insights} />
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, change, trend, subtitle, icon: Icon }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-xs text-gray-600">{title}</div>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-2">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {trend === "up" && (
          <>
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-green-600">{change}</span>
          </>
        )}
        {trend === "down" && (
          <>
            <TrendingDown className="w-3 h-3 text-red-600" />
            <span className="text-red-600">{change}</span>
          </>
        )}
        {trend === "warning" && (
          <>
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span className="text-orange-600">{change}</span>
          </>
        )}
        <span className="text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
}

// Segment Chart Component
function SegmentChart({ data }) {
  if (!data) return <div className="border border-gray-200 rounded-lg p-6" />;

  const segmentColors = {
    Champions: "bg-green-500",
    Loyal: "bg-blue-500",
    Potential: "bg-yellow-500",
    "At-Risk": "bg-orange-500",
    Lost: "bg-red-500",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="text-xs font-semibold text-gray-900 mb-4">Customer Segments</div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.segment} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${segmentColors[item.segment] || "bg-gray-300"}`} />
              <span className="text-xs text-gray-700">{item.segment}</span>
            </div>
            <div className="text-xs text-gray-900">
              {item.count} ({item.percentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Revenue Chart Component
function RevenueChart({ data }) {
  if (!data) return <div className="border border-gray-200 rounded-lg p-6" />;

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="text-xs font-semibold text-gray-900 mb-4">Revenue by Segment</div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.segment}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700">{item.segment}</span>
              <span className="text-xs text-gray-900">${item.revenue.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full"
                style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Insight Cards Component
function InsightCards({ insights }) {
  if (!insights) return <div className="border border-gray-200 rounded-lg p-6" />;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="text-xs font-semibold text-gray-900 mb-4">Opportunities</div>
      <div className="space-y-4">
        <InsightCard
          icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
          title="High Churn Risk"
          count={insights.highChurnRisk.count}
          description="haven't ordered in 90+ days"
          action="Create Win-Back Campaign"
        />
        <InsightCard
          icon={<Target className="w-4 h-4 text-blue-600" />}
          title="High-Value Low Engagement"
          count={insights.highValueLowEngagement.count}
          description="spend $500+ but rarely engage"
          action="Reduce Email Frequency"
        />
        <InsightCard
          icon={<TrendingUp className="w-4 h-4 text-green-600" />}
          title="Ready for Upsell"
          count={insights.readyForUpsell.count}
          description="ordered 5+ times, growing AOV"
          action="Create VIP Offer"
        />
      </div>
    </div>
  );
}

function InsightCard({ icon, title, count, description, action }) {
  return (
    <div className="border-l-2 border-gray-300 pl-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-900">{title}</span>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {count} customers {description}
      </div>
      <button className="text-xs text-gray-900 hover:underline">{action} →</button>
    </div>
  );
}
