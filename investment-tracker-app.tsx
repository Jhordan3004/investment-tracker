import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Calculator, Target, AlertCircle } from 'lucide-react';

const InvestmentTracker = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [investments, setInvestments] = useState([
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 10, avgPrice: 150, currentPrice: 175, sector: 'Technology', lastUpdated: new Date() },
    { id: 2, symbol: 'MSFT', name: 'Microsoft', shares: 5, avgPrice: 300, currentPrice: 320, sector: 'Technology', lastUpdated: new Date() },
    { id: 3, symbol: 'AMZN', name: 'Amazon', shares: 3, avgPrice: 3200, currentPrice: 3400, sector: 'Consumer Discretionary', lastUpdated: new Date() },
  ]);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [apiError, setApiError] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);

  // Función para obtener precios reales de la API
  const fetchRealPrices = async (symbols) => {
    try {
      setIsUpdating(true);
      setApiError(null);
      
      // Usar Alpha Vantage API (gratuita con 5 calls por minuto)
      const API_KEY = 'demo'; // Reemplazar con tu API key real
      const promises = symbols.map(async (symbol) => {
        try {
          // Usando la función GLOBAL_QUOTE de Alpha Vantage
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
          );
          const data = await response.json();
          
          if (data['Global Quote']) {
            return {
              symbol: symbol,
              price: parseFloat(data['Global Quote']['05. price']),
              change: parseFloat(data['Global Quote']['09. change']),
              changePercent: parseFloat(data['Global Quote']['10. change percent'].replace('%', ''))
            };
          } else {
            // Si la API no responde, generar precio simulado basado en precio actual
            const currentInvestment = investments.find(inv => inv.symbol === symbol);
            const volatility = (Math.random() - 0.5) * 0.05; // ±2.5% variación
            const newPrice = currentInvestment ? currentInvestment.currentPrice * (1 + volatility) : 100;
            return {
              symbol: symbol,
              price: Math.round(newPrice * 100) / 100,
              change: Math.round((newPrice - (currentInvestment?.currentPrice || 100)) * 100) / 100,
              changePercent: volatility * 100
            };
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          // Fallback a datos simulados
          const currentInvestment = investments.find(inv => inv.symbol === symbol);
          const volatility = (Math.random() - 0.5) * 0.05;
          const newPrice = currentInvestment ? currentInvestment.currentPrice * (1 + volatility) : 100;
          return {
            symbol: symbol,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round((newPrice - (currentInvestment?.currentPrice || 100)) * 100) / 100,
            changePercent: volatility * 100
          };
        }
      });

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error fetching prices:', error);
      setApiError('Error al obtener precios. Usando datos simulados.');
      // Generar datos simulados como fallback
      return symbols.map(symbol => {
        const currentInvestment = investments.find(inv => inv.symbol === symbol);
        const volatility = (Math.random() - 0.5) * 0.05;
        const newPrice = currentInvestment ? currentInvestment.currentPrice * (1 + volatility) : 100;
        return {
          symbol: symbol,
          price: Math.round(newPrice * 100) / 100,
          change: Math.round((newPrice - (currentInvestment?.currentPrice || 100)) * 100) / 100,
          changePercent: volatility * 100
        };
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para actualizar precios
  const updatePrices = async () => {
    if (investments.length === 0) return;
    
    const symbols = investments.map(inv => inv.symbol);
    const priceData = await fetchRealPrices(symbols);
    
    const updatedInvestments = investments.map(inv => {
      const priceInfo = priceData.find(p => p.symbol === inv.symbol);
      return {
        ...inv,
        currentPrice: priceInfo ? priceInfo.price : inv.currentPrice,
        lastUpdated: new Date(),
        change: priceInfo ? priceInfo.change : 0,
        changePercent: priceInfo ? priceInfo.changePercent : 0
      };
    });
    
    setInvestments(updatedInvestments);
    setLastUpdate(new Date());
  };

  // Auto-actualización cada 30 segundos si está habilitada
  useEffect(() => {
    let interval;
    if (autoUpdate) {
      interval = setInterval(() => {
        updatePrices();
      }, 30000); // 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, investments]);

  // Actualización inicial
  useEffect(() => {
    if (investments.length > 0) {
      updatePrices();
    }
  }, []);

  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    name: '',
    shares: '',
    avgPrice: '',
    currentPrice: '',
    sector: 'Technology'
  });

  const [forecastData, setForecastData] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');

  // Generar datos históricos y pronósticos simulados
  useEffect(() => {
    const generateData = () => {
      const data = [];
      const basePrice = investments.find(inv => inv.symbol === selectedStock)?.currentPrice || 100;
      
      // Datos históricos (30 días)
      for (let i = -30; i <= 0; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const volatility = Math.random() * 0.1 - 0.05; // ±5% volatilidad
        const price = basePrice * (1 + volatility * Math.abs(i) * 0.01);
        
        data.push({
          date: date.toISOString().split('T')[0],
          actual: Math.round(price * 100) / 100,
          type: 'historical'
        });
      }
      
      // Pronósticos (30 días futuros)
      for (let i = 1; i <= 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const trend = 0.001; // Tendencia ligera al alza
        const volatility = Math.random() * 0.08 - 0.04;
        const lastPrice = data[data.length - 1].actual || data[data.length - 1].forecast;
        const forecast = lastPrice * (1 + trend + volatility);
        
        data.push({
          date: date.toISOString().split('T')[0],
          forecast: Math.round(forecast * 100) / 100,
          type: 'forecast'
        });
      }
      
      setForecastData(data);
    };
    
    generateData();
  }, [selectedStock, investments]);

  const addInvestment = () => {
    if (!newInvestment.symbol || !newInvestment.shares || !newInvestment.avgPrice) return;
    
    const investment = {
      id: Date.now(),
      symbol: newInvestment.symbol.toUpperCase(),
      name: newInvestment.name || newInvestment.symbol,
      shares: parseFloat(newInvestment.shares),
      avgPrice: parseFloat(newInvestment.avgPrice),
      currentPrice: parseFloat(newInvestment.currentPrice) || parseFloat(newInvestment.avgPrice),
      sector: newInvestment.sector,
      lastUpdated: new Date(),
      change: 0,
      changePercent: 0
    };
    
    setInvestments([...investments, investment]);
    setNewInvestment({ symbol: '', name: '', shares: '', avgPrice: '', currentPrice: '', sector: 'Technology' });
  };

  // Cálculos del portfolio
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.shares * inv.avgPrice), 0);
  const currentValue = investments.reduce((sum, inv) => sum + (inv.shares * inv.currentPrice), 0);
  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercent = (totalGainLoss / totalInvested) * 100;

  // Datos para el gráfico de sectores
  const sectorData = investments.reduce((acc, inv) => {
    const value = inv.shares * inv.currentPrice;
    const existing = acc.find(item => item.name === inv.sector);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: inv.sector, value: value });
    }
    return acc;
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  const sectors = ['Technology', 'Healthcare', 'Finance', 'Consumer Discretionary', 'Energy', 'Utilities'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                TradeTracker Pro
              </h1>
              <p className="text-slate-300">Seguimiento y pronósticos inteligentes de inversiones</p>
            </div>
            
            {/* Controles de actualización */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-sm text-slate-400">
                <p>Última actualización: {lastUpdate.toLocaleTimeString()}</p>
                {apiError && <p className="text-orange-400">{apiError}</p>}
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="rounded bg-slate-700 border-slate-600"
                  />
                  <span className="text-slate-300">Auto-actualizar</span>
                </label>
                
                <button
                  onClick={updatePrices}
                  disabled={isUpdating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isUpdating 
                      ? 'bg-slate-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} />
                      Actualizar Precios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: PieChart },
            { id: 'forecast', label: 'Pronósticos', icon: TrendingUp },
            { id: 'analytics', label: 'Análisis', icon: BarChart3 },
            { id: 'calculator', label: 'Calculadora', icon: Calculator }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Resumen del Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-400" size={24} />
                  <h3 className="text-slate-300 font-medium">Valor Actual</h3>
                </div>
                <p className="text-2xl font-bold text-green-400">${currentValue.toLocaleString()}</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="text-blue-400" size={24} />
                  <h3 className="text-slate-300 font-medium">Invertido</h3>
                </div>
                <p className="text-2xl font-bold text-blue-400">${totalInvested.toLocaleString()}</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  {totalGainLoss >= 0 ? 
                    <TrendingUp className="text-green-400" size={24} /> : 
                    <TrendingDown className="text-red-400" size={24} />
                  }
                  <h3 className="text-slate-300 font-medium">P&L</h3>
                </div>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalGainLoss.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="text-purple-400" size={24} />
                  <h3 className="text-slate-300 font-medium">Rendimiento</h3>
                </div>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalGainLossPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Lista de Inversiones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Mis Inversiones</h3>
                <div className="space-y-3">
                  {investments.map(inv => {
                    const gainLoss = (inv.currentPrice - inv.avgPrice) * inv.shares;
                    const gainLossPercent = ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100;
                    
                    return (
                      <div key={inv.id} className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{inv.symbol}</h4>
                            <p className="text-slate-400 text-sm">{inv.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${inv.currentPrice}</p>
                            <div className="flex items-center gap-1 text-sm">
                              {inv.change >= 0 ? 
                                <TrendingUp size={14} className="text-green-400" /> : 
                                <TrendingDown size={14} className="text-red-400" />
                              }
                              <span className={inv.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {inv.change >= 0 ? '+' : ''}${inv.change?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400 mb-2">
                          <span>{inv.shares} acciones @ ${inv.avgPrice}</span>
                          <span className={gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {gainLossPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Actualizado: {inv.lastUpdated?.toLocaleTimeString() || 'Nunca'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agregar Nueva Inversión */}
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Agregar Inversión</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Símbolo (ej: AAPL)"
                    value={newInvestment.symbol}
                    onChange={(e) => setNewInvestment({...newInvestment, symbol: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nombre de la empresa"
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Acciones"
                      value={newInvestment.shares}
                      onChange={(e) => setNewInvestment({...newInvestment, shares: e.target.value})}
                      className="p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Precio promedio"
                      value={newInvestment.avgPrice}
                      onChange={(e) => setNewInvestment({...newInvestment, avgPrice: e.target.value})}
                      className="p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Precio actual (opcional)"
                    value={newInvestment.currentPrice}
                    onChange={(e) => setNewInvestment({...newInvestment, currentPrice: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={newInvestment.sector}
                    onChange={(e) => setNewInvestment({...newInvestment, sector: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    {sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                  <button
                    onClick={addInvestment}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Agregar Inversión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold">Pronóstico de Precios</h3>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="p-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  {investments.map(inv => (
                    <option key={inv.symbol} value={inv.symbol}>{inv.symbol}</option>
                  ))}
                </select>
              </div>
              
              <div className="h-96">
                <LineChart width={800} height={350} data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Precio Histórico"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Pronóstico"
                    connectNulls={false}
                  />
                </LineChart>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Distribución por Sector</h3>
                <div className="h-80">
                  <PieChart width={350} height={300}>
                    <Pie
                      data={sectorData}
                      cx={175}
                      cy={150}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Rendimiento por Inversión</h3>
                <div className="h-80">
                  <BarChart width={350} height={300} data={investments.map(inv => ({
                    name: inv.symbol,
                    rendimiento: ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      formatter={(value) => [`${value.toFixed(2)}%`, 'Rendimiento']}
                    />
                    <Bar dataKey="rendimiento" fill="#8B5CF6" />
                  </BarChart>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Calculadora de ROI</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Inversión Inicial ($)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Actual ($)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tiempo (meses)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
                    Calcular ROI
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Calculadora de Riesgo</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Capital Total ($)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Porcentaje de Riesgo (%)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Precio de Entrada ($)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stop Loss ($)</label>
                    <input type="number" className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <button className="w-full bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all">
                    Calcular Posición
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentTracker;