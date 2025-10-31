import React, { useState } from 'react';
import CatalogShare from './components/catalogShare';

function App() {
  const [artisanId, setArtisanId] = useState('test_artisan_1');
  const [artisanName, setArtisanName] = useState('Test Artisan Shop');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛍️ WhatsApp Catalog Test App
          </h1>
          <p className="text-gray-600">
            Test catalog generation and WhatsApp sharing functionality
          </p>
        </div>

        {/* Artisan Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan ID
              </label>
              <input
                type="text"
                value={artisanId}
                onChange={(e) => setArtisanId(e.target.value)}
                placeholder="Enter artisan ID from Firestore"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* <p className="text-xs text-gray-500 mt-1">
                This should match a document ID in your 'profiles' collection
              </p> */}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan Name
              </label>
              <input
                type="text"
                value={artisanName}
                onChange={(e) => setArtisanName(e.target.value)}
                placeholder="Enter artisan name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name for the artisan
              </p>
            </div>
          </div>
        </div>

        {/* Catalog Share Component */}
        <CatalogShare artisanId={artisanId} artisanName={artisanName} />

        {/* Instructions */}
        {/* <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📋 Setup Instructions</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Firestore Setup</h3>
              <p>Create test data in Firestore:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Collection: <code className="bg-gray-100 px-2 py-1 rounded">users</code></li>
                <li>Document ID: <code className="bg-gray-100 px-2 py-1 rounded">test_artisan_1</code></li>
                <li>Fields: <code className="bg-gray-100 px-2 py-1 rounded">name</code>, <code className="bg-gray-100 px-2 py-1 rounded">email</code>, <code className="bg-gray-100 px-2 py-1 rounded">phone</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Products Setup</h3>
              <p>Add products in Firestore:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Collection: <code className="bg-gray-100 px-2 py-1 rounded">products</code></li>
                <li>Fields: <code className="bg-gray-100 px-2 py-1 rounded">artisan_id</code> (set to test_artisan_1), <code className="bg-gray-100 px-2 py-1 rounded">name</code>, <code className="bg-gray-100 px-2 py-1 rounded">price</code>, <code className="bg-gray-100 px-2 py-1 rounded">description</code>, <code className="bg-gray-100 px-2 py-1 rounded">image_url</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Backend Running</h3>
              <p className="mb-2">Make sure your backend is running on port 8000:</p>
              <code className="bg-gray-100 px-3 py-2 rounded block">cd backend && python main.py</code>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default App;