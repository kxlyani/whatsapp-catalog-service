import React, { useState } from 'react';
import { 
  Share2, 
  Download, 
  MessageCircle, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  History,
  AlertCircle,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Tag,
  Send,
  Search,
  X,
  Filter,
  ChevronDown
} from 'lucide-react';

/**
 * Feature: Contact-based WhatsApp Catalog Sharing
 * Author: Claude AI Assistant
 * Date: November 2025
 * Purpose: Complete customer management and bulk WhatsApp sharing system
 */

// ==================== TOAST NOTIFICATION COMPONENT ====================
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Loader2 size={20} className="animate-spin" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-2 ${colors[type]} flex items-center gap-3 animate-slide-in`}>
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-70">
        <X size={18} />
      </button>
    </div>
  );
};

// ==================== ADD/EDIT CUSTOMER MODAL ====================
const CustomerModal = ({ 
  isOpen, 
  onClose, 
  customer = null, 
  artisanId, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone_number: customer?.phone_number || '',
    tags: customer?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format phone number as user types
  const handlePhoneChange = (value) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Remove leading zeros
    digits = digits.replace(/^0+/, '');
    
    // Limit to 10 digits
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }
    
    setFormData(prev => ({ ...prev, phone_number: digits }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!customer && !formData.phone_number.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (formData.phone_number && formData.phone_number.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const tags = formData.tags 
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const payload = {
        name: formData.name.trim(),
        tags: tags
      };

      // Only include phone number if it's provided
      if (formData.phone_number.trim()) {
        payload.phone_number = formData.phone_number.trim();
      }

      const url = customer 
        ? `/api/catalog/customers/${artisanId}/${customer.id}`
        : `/api/catalog/customers/${artisanId}`;
      
      const method = customer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(customer ? 'Customer updated successfully!' : 'Customer added successfully!');
        onClose();
      } else {
        setError(data.detail || 'Operation failed');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer name"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number {!customer && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                +91
              </span>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9876543210"
                maxLength="10"
                disabled={loading || (customer && !formData.phone_number)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {customer 
                ? 'Leave empty to keep current number' 
                : '10 digits, country code will be added automatically'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VIP, Regular, Wholesale"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Examples: VIP, Regular, Bulk Buyer, New Lead
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {customer ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {customer ? <Edit2 size={18} /> : <UserPlus size={18} />}
                {customer ? 'Update Customer' : 'Add Customer'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== CUSTOMER SELECTION MODAL ====================
const CustomerSelectionModal = ({ 
  isOpen, 
  onClose, 
  customers, 
  catalogUrl,
  artisanId,
  onSuccess 
}) => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set();
    customers.forEach(customer => {
      if (customer.tags && Array.isArray(customer.tags)) {
        customer.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [customers]);

  // Filter customers
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone_number.includes(searchTerm);
      const matchesTag = !filterTag || (customer.tags && customer.tags.includes(filterTag));
      return matchesSearch && matchesTag;
    });
  }, [customers, searchTerm, filterTag]);

  const toggleCustomer = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleShare = async () => {
    if (selectedCustomers.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/catalog/share-whatsapp-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          customer_ids: selectedCustomers,
          catalog_url: catalogUrl,
          custom_message: customMessage || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(
          `Bulk share complete! Sent: ${data.sent}, Failed: ${data.failed}`,
          data.failed > 0 ? 'warning' : 'success'
        );
        onClose();
      } else {
        onSuccess(data.detail || 'Error in bulk sharing', 'error');
      }
    } catch (error) {
      onSuccess(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b">
          <div>
            <h3 className="text-xl font-semibold">Select Customers</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCustomers.length} selected
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-gray-500" />
              <button
                onClick={() => setFilterTag('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !filterTag 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterTag === tag
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Select All */}
        {filteredCustomers.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
              onChange={selectAll}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({filteredCustomers.length})
            </span>
          </div>
        )}

        {/* Customer List */}
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto text-gray-300 mb-2" />
              <p>No customers found</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => toggleCustomer(customer.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCustomers.includes(customer.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => toggleCustomer(customer.id)}
                    className="w-5 h-5 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                    <p className="text-sm text-gray-600">
                      {customer.phone_number.substring(0, 7)}*****
                    </p>
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {customer.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            placeholder="Use {name} to personalize. Example: Hi {name}! Check out our latest catalog..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Use {'{name}'} to automatically insert customer names
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={loading || selectedCustomers.length === 0}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP COMPONENT ====================
const App = () => {
  const [artisanId, setArtisanId] = useState('test_artisan_1');
  const [artisanName, setArtisanName] = useState('Test Artisan Shop');
  const [activeTab, setActiveTab] = useState('generate');
  
  // Catalog states
  const [loading, setLoading] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState(null);
  const [catalogType, setCatalogType] = useState(null);
  
  // Customer states
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  
  // Toast notification
  const [toast, setToast] = useState(null);

  // Fetch customers when tab changes
  React.useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab, artisanId]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = filterTag 
        ? `/api/catalog/customers/${artisanId}?tag=${encodeURIComponent(filterTag)}&sort=${sortBy}`
        : `/api/catalog/customers/${artisanId}?sort=${sortBy}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers);
      } else {
        showToast('Error loading customers', 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateCatalog = async (type) => {
    setLoading(true);
    showToast(`Generating ${type.toUpperCase()} catalog...`, 'info');

    try {
      const response = await fetch('/api/catalog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          catalog_type: type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCatalogUrl(data.catalog_url);
        setCatalogType(type);
        showToast(
          `${type.toUpperCase()} catalog generated! (${data.product_count} products)`,
          'success'
        );
      } else {
        showToast(data.detail || 'Error generating catalog', 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to delete ${customerName}?`)) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/catalog/customers/${artisanId}/${customerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Customer deleted successfully!', 'success');
        fetchCustomers();
      } else {
        showToast(data.detail || 'Error deleting customer', 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set();
    customers.forEach(customer => {
      if (customer.tags && Array.isArray(customer.tags)) {
        customer.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [customers]);

  // Filter customers
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone_number.includes(searchTerm);
      const matchesTag = !filterTag || (customer.tags && customer.tags.includes(filterTag));
      return matchesSearch && matchesTag;
    });
  }, [customers, searchTerm, filterTag]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛍️ WhatsApp Catalog Manager
          </h1>
          <p className="text-gray-600">
            Generate catalogs and share with your customers via WhatsApp
          </p>
        </div>

        {/* Artisan Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan ID
              </label>
              <input
                type="text"
                value={artisanId}
                onChange={(e) => setArtisanId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan Name
              </label>
              <input
                type="text"
                value={artisanName}
                onChange={(e) => setArtisanName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'generate'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Generate & Share
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'customers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={18} />
              My Customers ({customers.length})
            </button>
          </div>

          <div className="p-6">
            {/* GENERATE TAB */}
            {activeTab === 'generate' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">1. Generate Catalog</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => generateCatalog('pdf')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                      Generate PDF Catalog
                    </button>

                    <button
                      onClick={() => generateCatalog('image')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                      Generate Image Catalog
                    </button>
                  </div>
                </div>

                {catalogUrl && (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Catalog Ready! 🎉</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Type: <span className="font-semibold uppercase">{catalogType}</span>
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={catalogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download size={18} />
                          View Catalog
                        </a>
                        <button
                          onClick={() => {
                            if (customers.length === 0) {
                              showToast('Please add customers first', 'warning');
                              setActiveTab('customers');
                            } else {
                              setShowSelectionModal(true);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Share2 size={18} />
                          Share to Customers
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                {/* Header with Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">My Customers</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your customer contacts for bulk sharing
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentCustomer(null);
                      setShowCustomerModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <UserPlus size={18} />
                    Add Customer
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        fetchCustomers();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recent">Recently Added</option>
                      <option value="name">By Name</option>
                    </select>
                  </div>

                  {/* Tag Filters */}
                  {allTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600 font-medium">Filter:</span>
                      <button
                        onClick={() => {
                          setFilterTag('');
                          fetchCustomers();
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          !filterTag 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setFilterTag(tag === filterTag ? '' : tag);
                            fetchCustomers();
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            filterTag === tag
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer List */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500">Loading customers...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-16">
                    <Users size={64} className="mx-auto text-gray-300 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">
                      {searchTerm || filterTag ? 'No customers found' : 'No customers yet'}
                    </h4>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || filterTag 
                        ? 'Try adjusting your search or filters' 
                        : 'Start by adding your first customer contact'}
                    </p>
                    {!searchTerm && !filterTag && (
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        <UserPlus size={20} />
                        Add Your First Customer
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {customer.name}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">
                              📱 {customer.phone_number.substring(0, 7)}*****
                            </p>
                            
                            {customer.tags && customer.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {customer.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                                  >
                                    <Tag size={12} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex gap-4 mt-3 text-xs text-gray-500">
                              <span>📦 Orders: {customer.total_orders || 0}</span>
                              {customer.last_order_at && (
                                <span>
                                  🕒 Last: {new Date(customer.last_order_at._seconds * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCurrentCustomer(customer);
                                setShowCustomerModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit customer"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteCustomer(customer.id, customer.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete customer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Action: Share Catalog */}
                {filteredCustomers.length > 0 && catalogUrl && (
                  <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900">
                          📱 Ready to Share Catalog
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          You have a catalog ready. Select customers to share it with them.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowSelectionModal(true)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors font-semibold whitespace-nowrap"
                      >
                        <Share2 size={18} />
                        Select & Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setCurrentCustomer(null);
        }}
        customer={currentCustomer}
        artisanId={artisanId}
        onSuccess={(message) => {
          showToast(message, 'success');
          fetchCustomers();
        }}
      />

      <CustomerSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        customers={customers}
        catalogUrl={catalogUrl}
        artisanId={artisanId}
        onSuccess={showToast}
      />

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;