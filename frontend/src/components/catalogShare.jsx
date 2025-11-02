import React, { useState, useEffect } from "react"
import { 
  Share2, FileText, Eye, Send, Download, Loader, CheckCircle, 
  AlertCircle, Users, UserPlus, Edit2, Trash2, Tag, X 
} from "lucide-react"

// Replace with your actual backend URL
const BACKEND_URL = "http://localhost:8000"

function CatalogPromotion({ artisanId, artisanName }) {
  const API_BASE_URL = BACKEND_URL
  
  // State management
  const [loading, setLoading] = useState(false)
  const [generatingCatalog, setGeneratingCatalog] = useState(false)
  const [currentCatalog, setCurrentCatalog] = useState(null)
  const [catalogHistory, setCatalogHistory] = useState([])
  const [catalogType, setCatalogType] = useState('pdf')
  
  // Tag-based customer management
  const [tagGroups, setTagGroups] = useState([]) // Array of {tag, count}
  const [allCustomersCount, setAllCustomersCount] = useState(0)
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  
  // Customer form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone_number: '',
    tags: ''
  })
  
  // Share modal
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [selectAllTags, setSelectAllTags] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  
  // Messages
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    if (artisanId) {
      loadCatalogHistory()
      loadCustomerTags()
    }
  }, [artisanId])

  async function loadCatalogHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/history/${artisanId}?limit=5`)
      const data = await response.json()
      
      if (data.success && data.catalogs && data.catalogs.length > 0) {
        setCatalogHistory(data.catalogs)
        setCurrentCatalog(data.catalogs[0])
      }
    } catch (err) {
      console.error("Error loading catalog history:", err)
    }
  }

  async function loadCustomerTags() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/catalog/customers/${artisanId}`)
      const data = await response.json()
      
      if (data.success) {
        const customers = data.customers || []
        setAllCustomersCount(customers.length)
        
        // Aggregate customers by tags
        const tagMap = new Map()
        
        customers.forEach(customer => {
          const customerTags = customer.tags || []
          
          customerTags.forEach(tag => {
            if (tagMap.has(tag)) {
              tagMap.set(tag, tagMap.get(tag) + 1)
            } else {
              tagMap.set(tag, 1)
            }
          })
        })
        
        // Convert to array and sort by count
        const tagArray = Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
        
        setTagGroups(tagArray)
      }
    } catch (err) {
      console.error("Error loading customer tags:", err)
      setError("Failed to load customer data")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateCatalog(type = 'pdf') {
    setGeneratingCatalog(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          catalog_type: type
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate catalog')
      }

      if (data.success) {
        const newCatalog = {
          url: data.catalog_url,
          type: type,
          product_count: data.product_count,
          created_at: new Date().toISOString()
        }
        setCurrentCatalog(newCatalog)
        setSuccessMessage(`✅ ${type.toUpperCase()} catalog generated successfully!`)
        await loadCatalogHistory()
      }
    } catch (err) {
      setError(err.message || 'Failed to generate catalog')
      console.error("Catalog generation error:", err)
    } finally {
      setGeneratingCatalog(false)
    }
  }

  async function handleAddCustomer() {
    if (!customerForm.name.trim() || !customerForm.phone_number.trim()) {
      setError("Name and phone number are required")
      return
    }

    try {
      setLoading(true)
      const tags = customerForm.tags 
        ? customerForm.tags.split(',').map(t => t.trim()).filter(t => t)
        : []

      const response = await fetch(`${API_BASE_URL}/api/catalog/customers/${artisanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerForm.name.trim(),
          phone_number: customerForm.phone_number.trim(),
          tags: tags
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save customer')
      }

      setSuccessMessage('✅ Customer added!')
      setShowAddCustomerModal(false)
      setCustomerForm({ name: '', phone_number: '', tags: '' })
      await loadCustomerTags()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleTagSelection(tag) {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  function handleSelectAllTags() {
    if (selectAllTags) {
      setSelectedTags([])
      setSelectAllTags(false)
    } else {
      setSelectedTags(tagGroups.map(tg => tg.tag))
      setSelectAllTags(true)
    }
  }

  async function handleShareToTags() {
    if (selectedTags.length === 0 && !selectAllTags) {
      setError("Please select at least one tag or 'All Customers'")
      return
    }

    if (!currentCatalog || !currentCatalog.url) {
      setError("Please generate a catalog first")
      return
    }

    try {
      setLoading(true)
      
      // Fetch customers based on selected tags
      const response = await fetch(`${API_BASE_URL}/api/catalog/customers/${artisanId}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error("Failed to fetch customers")
      }
      
      const allCustomers = data.customers || []
      let targetCustomers = []
      
      if (selectAllTags) {
        // Send to all customers
        targetCustomers = allCustomers
      } else {
        // Filter customers by selected tags
        targetCustomers = allCustomers.filter(customer => 
          customer.tags && customer.tags.some(tag => selectedTags.includes(tag))
        )
      }
      
      if (targetCustomers.length === 0) {
        setError("No customers found with the selected tags")
        return
      }
      
      const customerIds = targetCustomers.map(c => c.id)
      
      // Send catalog via WhatsApp
      const shareResponse = await fetch(`${API_BASE_URL}/api/catalog/share-whatsapp-customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          customer_ids: customerIds,
          catalog_url: currentCatalog.url,
          custom_message: customMessage || undefined
        })
      })

      const shareData = await shareResponse.json()

      if (!shareResponse.ok) {
        throw new Error(shareData.detail || 'Failed to share catalog')
      }

      setSuccessMessage(
        `✅ Catalog shared to ${shareData.sent}/${shareData.total} customers!`
      )
      setShowShareModal(false)
      setSelectedTags([])
      setSelectAllTags(false)
      setCustomMessage("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTotalCustomersInSelectedTags = () => {
    if (selectAllTags) return allCustomersCount
    
    return tagGroups
      .filter(tg => selectedTags.includes(tg.tag))
      .reduce((sum, tg) => sum + tg.count, 0)
  }

  return (
    <div>
      {/* Error/Success Messages */}
      {error && (
        <div style={{ 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626", flexShrink: 0 }} />
          <p style={{ color: "#dc2626", margin: 0, flex: 1 }}>{error}</p>
          <button 
            onClick={() => setError(null)} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              padding: "0.25rem"
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{ 
          background: "rgba(34, 197, 94, 0.1)", 
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a", flexShrink: 0 }} />
          <p style={{ color: "#16a34a", margin: 0, flex: 1 }}>{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              padding: "0.25rem"
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Catalog Section */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <div style={{ 
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", 
          color: "white",
          padding: "1.5rem"
        }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold" }}>
            <FileText style={{ width: "24px", height: "24px" }} />
            Promote My Business
          </h3>
          <p style={{ margin: "0.5rem 0 0 0", opacity: 0.95 }}>
            Generate and share your product catalog with customers
          </p>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Current Catalog Display */}
          {currentCatalog && (
            <div style={{ 
              background: "rgba(139, 92, 246, 0.05)", 
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    📄 Latest Catalog
                  </h4>
                  <p style={{ fontSize: "0.85rem", margin: 0, color: "#6b7280" }}>
                    Generated on {new Date(currentCatalog.created_at).toLocaleString()}
                  </p>
                  <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "#6b7280" }}>
                    Type: {currentCatalog.type?.toUpperCase()} | Products: {currentCatalog.product_count || 0}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a
                    href={currentCatalog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      background: "#6b7280",
                      color: "white",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "0.9rem"
                    }}
                  >
                    <Eye style={{ width: "16px", height: "16px" }} />
                    View
                  </a>
                  <a
                    href={currentCatalog.url}
                    download
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      background: "#6b7280",
                      color: "white",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "0.9rem"
                    }}
                  >
                    <Download style={{ width: "16px", height: "16px" }} />
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Catalog Type Selection */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
              Catalog Type
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="catalogType" 
                  value="pdf"
                  checked={catalogType === 'pdf'}
                  onChange={(e) => setCatalogType(e.target.value)}
                />
                <span>PDF (Professional)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="catalogType" 
                  value="image"
                  checked={catalogType === 'image'}
                  onChange={(e) => setCatalogType(e.target.value)}
                />
                <span>Image (Social Media)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem", 
            marginBottom: "1.5rem" 
          }}>
            <button
              onClick={() => handleGenerateCatalog(catalogType)}
              disabled={generatingCatalog}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                justifyContent: "center",
                padding: "0.75rem 1rem",
                background: generatingCatalog ? "#9ca3af" : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: generatingCatalog ? "not-allowed" : "pointer",
                fontWeight: "500"
              }}
            >
              {generatingCatalog ? (
                <>
                  <Loader style={{ width: "18px", height: "18px" }} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText style={{ width: "18px", height: "18px" }} />
                  Generate Catalog
                </>
              )}
            </button>

            <button
              onClick={() => setShowTagsModal(true)}
              style={{ 
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                padding: "0.75rem 1rem",
                background: "#14b8a6",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              <Users style={{ width: "18px", height: "18px" }} />
              Customer Groups ({tagGroups.length})
            </button>

            {currentCatalog && (
              <button
                onClick={() => {
                  if (allCustomersCount === 0) {
                    setError("Please add customers first")
                    setShowTagsModal(true)
                  } else {
                    setShowShareModal(true)
                  }
                }}
                disabled={loading}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem", 
                  justifyContent: "center",
                  padding: "0.75rem 1rem",
                  background: loading ? "#9ca3af" : "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "500"
                }}
              >
                <Send style={{ width: "18px", height: "18px" }} />
                Share on WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Tags Modal */}
      {showTagsModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
            maxWidth: "600px", 
            width: "100%", 
            maxHeight: "90vh", 
            overflow: "auto" 
          }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <h3 style={{ margin: 0, fontWeight: "bold" }}>
                  <Users style={{ width: "20px", height: "20px", display: "inline", marginRight: "0.5rem" }} />
                  Customer Groups ({allCustomersCount} total)
                </h3>
                <button
                  onClick={() => setShowTagsModal(false)}
                  style={{ 
                    padding: "0.25rem 0.75rem",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              <button
                onClick={() => {
                  setCustomerForm({ name: '', phone_number: '', tags: '' })
                  setShowAddCustomerModal(true)
                }}
                style={{ 
                  marginBottom: "1rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                <UserPlus style={{ width: "18px", height: "18px" }} />
                Add New Customer
              </button>

              {loading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Loader className="spin" style={{ width: "48px", height: "48px", margin: "0 auto" }} />
                  <p>Loading customer groups...</p>
                </div>
              ) : tagGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <Users style={{ width: "64px", height: "64px", color: "#d1d5db", margin: "0 auto 1rem" }} />
                  <p style={{ color: "#6b7280" }}>No customer groups yet. Add customers with tags to create groups!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {tagGroups.map(tagGroup => (
                    <div
                      key={tagGroup.tag}
                      style={{ 
                        background: "#f9fafb", 
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "40px",
                            height: "40px",
                            background: "#6366f1",
                            borderRadius: "8px"
                          }}>
                            <Tag style={{ width: "20px", height: "20px", color: "white" }} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: "1rem", marginBottom: "0.25rem", fontWeight: "bold" }}>
                              {tagGroup.tag}
                            </h4>
                            <p style={{ fontSize: "0.85rem", margin: 0, color: "#6b7280" }}>
                              {tagGroup.count} customer{tagGroup.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          padding: "0.5rem 1rem",
                          background: "#e0e7ff",
                          color: "#4f46e5",
                          borderRadius: "999px",
                          fontSize: "0.9rem",
                          fontWeight: "600"
                        }}>
                          {tagGroup.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
            maxWidth: "500px", 
            width: "100%" 
          }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1.5rem" 
              }}>
                <h3 style={{ margin: 0, fontWeight: "bold" }}>Add New Customer</h3>
                <button
                  onClick={() => {
                    setShowAddCustomerModal(false)
                    setCustomerForm({ name: '', phone_number: '', tags: '' })
                  }}
                  style={{ 
                    padding: "0.25rem 0.75rem",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="Customer name"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "1rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerForm.phone_number}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                    placeholder="+919876543210"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "1rem"
                    }}
                  />
                  <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#6b7280" }}>
                    Include country code (e.g., +91 for India)
                  </p>
                </div>

                <div>
                  <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                    Tags (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={customerForm.tags}
                    onChange={(e) => setCustomerForm({ ...customerForm, tags: e.target.value })}
                    placeholder="VIP, Regular, Wholesale"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "1rem"
                    }}
                  />
                  <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#6b7280" }}>
                    Add at least one tag to group this customer
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setShowAddCustomerModal(false)
                      setCustomerForm({ name: '', phone_number: '', tags: '' })
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#f3f4f6",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: loading ? "#9ca3af" : "#6366f1",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {loading ? "Saving..." : "Add Customer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
            maxWidth: "600px", 
            width: "100%", 
            maxHeight: "90vh", 
            overflow: "auto" 
          }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: "bold" }}>Share Catalog</h3>
                  <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#6b7280" }}>
                    {getTotalCustomersInSelectedTags()} customer{getTotalCustomersInSelectedTags() !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowShareModal(false)
                    setSelectedTags([])
                    setSelectAllTags(false)
                    setCustomMessage("")
                  }}
                  style={{ 
                    padding: "0.25rem 0.75rem",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Select All Customers Option */}
              <div style={{ 
                marginBottom: "1rem", 
                padding: "1rem", 
                background: "#f0fdf4", 
                borderRadius: "8px",
                border: "2px solid #86efac"
              }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.75rem", 
                  cursor: "pointer" 
                }}>
                  <input
                    type="checkbox"
                    checked={selectAllTags}
                    onChange={handleSelectAllTags}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "1rem" }}>
                      All Customers
                    </span>
                    <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "#6b7280" }}>
                      Send to all {allCustomersCount} customers regardless of tags
                    </p>
                  </div>
                </label>
              </div>

              {/* Tag Selection */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "500", marginBottom: "0.75rem", display: "block" }}>
                  Or Select Specific Tags:
                </label>
                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                  {tagGroups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                      <p style={{ color: "#6b7280" }}>No customer groups available</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {tagGroups.map(tagGroup => (
                        <div
                          key={tagGroup.tag}
                          onClick={() => {
                            if (selectAllTags) setSelectAllTags(false)
                            toggleTagSelection(tagGroup.tag)
                          }}
                          style={{
                            cursor: "pointer",
                            background: selectedTags.includes(tagGroup.tag) && !selectAllTags
                              ? "rgba(34, 197, 94, 0.1)"
                              : "#f9fafb",
                            border: selectedTags.includes(tagGroup.tag) && !selectAllTags
                              ? "2px solid #22c55e"
                              : "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "0.75rem",
                            transition: "all 0.2s",
                            opacity: selectAllTags ? 0.5 : 1
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tagGroup.tag) && !selectAllTags}
                              onChange={() => {
                                if (selectAllTags) setSelectAllTags(false)
                                toggleTagSelection(tagGroup.tag)
                              }}
                              disabled={selectAllTags}
                              style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Tag style={{ width: "16px", height: "16px", color: "#6366f1" }} />
                                <h4 style={{ fontSize: "0.95rem", marginBottom: "0.25rem", fontWeight: "600" }}>
                                  {tagGroup.tag}
                                </h4>
                              </div>
                              <p style={{ fontSize: "0.8rem", margin: 0, color: "#6b7280" }}>
                                {tagGroup.count} customer{tagGroup.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div style={{
                              padding: "0.25rem 0.75rem",
                              background: "#e0e7ff",
                              color: "#4f46e5",
                              borderRadius: "999px",
                              fontSize: "0.85rem",
                              fontWeight: "600"
                            }}>
                              {tagGroup.count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Message */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                  Custom Message (Optional)
                </label>
                <textarea
                  rows="4"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Use {name} to personalize. Example: Hi {name}! Check out our latest catalog..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#6b7280" }}>
                  💡 Tip: Use {"{name}"} to automatically insert customer names
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    setShowShareModal(false)
                    setSelectedTags([])
                    setSelectAllTags(false)
                    setCustomMessage("")
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareToTags}
                  disabled={loading || (!selectAllTags && selectedTags.length === 0)}
                  style={{ 
                    flex: 2,
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    justifyContent: "center",
                    padding: "0.75rem",
                    background: (loading || (!selectAllTags && selectedTags.length === 0)) ? "#9ca3af" : "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (loading || (!selectAllTags && selectedTags.length === 0)) ? "not-allowed" : "pointer",
                    fontWeight: "500"
                  }}
                >
                  {loading ? (
                    <>
                      <Loader className="spin" style={{ width: "18px", height: "18px" }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send style={{ width: "18px", height: "18px" }} />
                      Send to {getTotalCustomersInSelectedTags()} Customer{getTotalCustomersInSelectedTags() !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CatalogPromotion