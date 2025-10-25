import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Download, 
  MessageCircle, 
  FileText, 
  Image,
  Loader2,
  CheckCircle,
  XCircle,
  History,
  AlertCircle
} from 'lucide-react';

const CatalogShare = ({ artisanId = 'demo-123', artisanName = 'Demo Artisan' }) => {
  const [loading, setLoading] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState(null);
  const [catalogType, setCatalogType] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [catalogHistory, setCatalogHistory] = useState([]);
  const [shareHistory, setShareHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, artisanId]);

  const fetchHistory = async () => {
    try {
      const [catalogsRes, sharesRes] = await Promise.all([
        fetch(`/api/catalog/history/${artisanId}`),
        fetch(`/api/catalog/shares/${artisanId}`)
      ]);

      const catalogsData = await catalogsRes.json();
      const sharesData = await sharesRes.json();

      if (catalogsData.success) setCatalogHistory(catalogsData.catalogs);
      if (sharesData.success) setShareHistory(sharesData.shares);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const generateCatalog = async (type) => {
    setLoading(true);
    setStatus({ message: `Generating ${type.toUpperCase()} catalog...`, type: 'info' });

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
        setStatus({ 
          message: `${type.toUpperCase()} catalog generated successfully! (${data.product_count} products)`, 
          type: 'success' 
        });
      } else {
        setStatus({ message: data.detail || 'Error generating catalog', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const shareViaWhatsApp = async () => {
    if (!phoneNumber.trim()) {
      setStatus({ message: 'Please enter a phone number', type: 'error' });
      return;
    }

    if (!catalogUrl) {
      setStatus({ message: 'Please generate a catalog first', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ message: 'Sending via WhatsApp...', type: 'info' });

    try {
      const response = await fetch('/api/catalog/share-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          phone_number: phoneNumber,
          catalog_url: catalogUrl,
          custom_message: customMessage || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          message: `Catalog shared successfully! Message SID: ${data.message_sid}`, 
          type: 'success' 
        });
        setPhoneNumber('');
        setCustomMessage('');
      } else {
        setStatus({ message: data.detail || 'Error sharing catalog', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const shareBulk = async () => {
    const numbers = phoneNumbers.split('\n').filter(n => n.trim());
    
    if (numbers.length === 0) {
      setStatus({ message: 'Please enter at least one phone number', type: 'error' });
      return;
    }

    if (!catalogUrl) {
      setStatus({ message: 'Please generate a catalog first', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ message: `Sending to ${numbers.length} contacts...`, type: 'info' });

    try {
      const response = await fetch('/api/catalog/share-whatsapp-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          phone_numbers: numbers,
          catalog_url: catalogUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          message: `Bulk share complete! Sent: ${data.sent}, Failed: ${data.failed}`, 
          type: data.failed > 0 ? 'warning' : 'success' 
        });
        setPhoneNumbers('');
      } else {
        setStatus({ message: data.detail || 'Error in bulk sharing', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp._seconds 
        ? new Date(timestamp._seconds * 1000)
        : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Share Product Catalog</h2>
        <p className="text-gray-600 mt-2">for {artisanName}</p>
        <p className="text-sm text-gray-500 mt-1">Artisan ID: <code className="bg-gray-100 px-2 py-1 rounded">{artisanId}</code></p>
      </div>

      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'generate'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Generate & Share
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={18} />
          History
        </button>
      </div>

      {status.message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : status.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : status.type === 'warning'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {status.type === 'success' && <CheckCircle size={20} />}
          {status.type === 'error' && <XCircle size={20} />}
          {status.type === 'warning' && <AlertCircle size={20} />}
          {status.type === 'info' && <Loader2 size={20} className="animate-spin" />}
          <span className="text-sm">{status.message}</span>
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">1. Generate Catalog</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => generateCatalog('pdf')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                Generate PDF Catalog
              </button>

              <button
                onClick={() => generateCatalog('image')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                Generate Image Catalog
              </button>
            </div>
          </div>

          {catalogUrl && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Catalog Ready! 🎉</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Type: <span className="font-semibold uppercase">{catalogType}</span>
                  </p>
                  <a
                    href={catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    <Download size={18} />
                    View/Download Catalog
                  </a>
                </div>
              </div>
            </div>
          )}

          {catalogUrl && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle size={24} className="text-green-600" />
                2. Share via WhatsApp Business
              </h3>

              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-3">Send to Single Contact</h4>
                
                <input
                  type="tel"
                  placeholder="Phone number (e.g., 9876543210)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <textarea
                  placeholder="Custom message (optional)"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={shareViaWhatsApp}
                  disabled={loading || !phoneNumber}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <MessageCircle size={20} />}
                  Send via WhatsApp
                </button>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-3">Send to Multiple Contacts</h4>
                <p className="text-sm text-gray-600 mb-3">Enter one phone number per line</p>
                
                <textarea
                  placeholder="9876543210&#10;9123456789&#10;9988776655"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />

                <button
                  onClick={shareBulk}
                  disabled={loading || !phoneNumbers.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
                  Send to All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Catalog History</h3>
            {catalogHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No catalogs generated yet</p>
            ) : (
              <div className="space-y-3">
                {catalogHistory.map((catalog, idx) => (
                  <div
                    key={catalog.id || idx}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        {catalog.type === 'pdf' ? (
                          <FileText size={24} className="text-blue-600" />
                        ) : (
                          <Image size={24} className="text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {catalog.type?.toUpperCase() || 'N/A'} Catalog
                        </p>
                        <p className="text-sm text-gray-600">
                          {catalog.product_count || 0} products • {formatDate(catalog.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={catalog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={() => {
                          setCatalogUrl(catalog.url);
                          setCatalogType(catalog.type);
                          setActiveTab('generate');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">WhatsApp Share History</h3>
            {shareHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No shares yet</p>
            ) : (
              <div className="space-y-3">
                {shareHistory.map((share, idx) => (
                  <div
                    key={share.id || idx}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <MessageCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {share.phone_number || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(share.created_at)}
                          </p>
                          {share.message_sid && (
                            <p className="text-xs text-gray-500 mt-1">
                              SID: {share.message_sid}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          share.status === 'sent' || share.status === 'delivered' || share.status === 'queued'
                            ? 'bg-green-100 text-green-800'
                            : share.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {share.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogShare;