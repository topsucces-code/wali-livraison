export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Test Tailwind CSS de base */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Test Tailwind CSS Simple
          </h1>
          <p className="text-gray-600 mb-4">
            Si vous voyez cette page avec des styles, Tailwind CSS fonctionne !
          </p>
        </div>

        {/* Test des couleurs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-500 text-white p-4 rounded-lg text-center">
            Rouge
          </div>
          <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
            Bleu
          </div>
          <div className="bg-green-500 text-white p-4 rounded-lg text-center">
            Vert
          </div>
          <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
            Jaune
          </div>
        </div>

        {/* Test des boutons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test des Boutons</h2>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Bouton Bleu
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Bouton Vert
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Bouton Rouge
            </button>
          </div>
        </div>

        {/* Test responsive */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Responsive</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-purple-100 p-4 rounded">
              <h3 className="font-medium">Mobile</h3>
              <p className="text-sm text-gray-600">Toujours visible</p>
            </div>
            <div className="bg-purple-200 p-4 rounded">
              <h3 className="font-medium">Tablet</h3>
              <p className="text-sm text-gray-600">Visible à partir de SM</p>
            </div>
            <div className="bg-purple-300 p-4 rounded">
              <h3 className="font-medium">Desktop</h3>
              <p className="text-sm text-gray-600">Visible à partir de LG</p>
            </div>
          </div>
        </div>

        {/* Test des couleurs WALI */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Couleurs WALI</h2>
          <div className="space-y-4">
            <div className="bg-orange-600 text-white p-4 rounded-lg">
              Orange WALI Principal (#ea580c)
            </div>
            <div className="bg-orange-500 text-white p-4 rounded-lg">
              Orange WALI Secondaire (#f97316)
            </div>
            <div className="bg-orange-400 text-white p-4 rounded-lg">
              Orange WALI Clair (#fb923c)
            </div>
          </div>
        </div>

        {/* Test des formulaires */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Formulaires</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Champ de texte
              </label>
              <input 
                type="text" 
                placeholder="Tapez quelque chose..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélecteur
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="test-checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="test-checkbox" className="ml-2 block text-sm text-gray-900">
                Case à cocher
              </label>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="space-x-4">
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800 underline">
              Dashboard
            </a>
            <a href="/addresses" className="text-blue-600 hover:text-blue-800 underline">
              Adresses
            </a>
            <a href="/test-ui" className="text-blue-600 hover:text-blue-800 underline">
              Test UI Complet
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
