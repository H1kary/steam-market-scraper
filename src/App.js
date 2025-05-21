import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [itemUrl, setItemUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Загрузка предметов при старте приложения
  useEffect(() => {
    fetchItems();
  }, []);

  // Функция для загрузки всех предметов
  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      setError('Ошибка при загрузке предметов');
    }
  };

  // Функция для добавления нового предмета
  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: itemUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при добавлении предмета');
      }

      setItems([...items, data]);
      setItemUrl('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления цены предмета
  const handleUpdatePrice = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/items/${id}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении цены');
      }

      const updatedItem = await response.json();
      setItems(items.map(item => item.id === id ? updatedItem : item));
    } catch (error) {
      setError(error.message);
    }
  };

  // Функция для удаления предмета
  const handleDeleteItem = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении предмета');
      }

      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="app">
      <h1>сюды ссылку и нажимай на кнопку</h1>
      
      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          value={itemUrl}
          onChange={(e) => setItemUrl(e.target.value)}
          placeholder="ссылку на предмет с торговой площадки"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Добавление...' : 'Добавить предмет'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="items-grid">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="item-card"
            onClick={() => window.open(`https://steamcommunity.com/market/listings/${item.appid}/${encodeURIComponent(item.market_hash_name)}`, '_blank')}
            style={{ cursor: 'pointer' }}
          >
            <div className="item-image">
              {item.imageUrl && <img src={item.imageUrl} alt={item.market_hash_name} />}
            </div>
            <div className="item-info">
              <h3>{item.market_hash_name}</h3>
              <p>AppID: {item.appid}</p>
              <p>Минимальная цена: {item.lowest_price}</p>
              <p>Медианная цена: {item.median_price}</p>
              <p>Продажи за сегодня: {item.volume}</p>
              <p>Последнее обновление: {item.lastUpdated}</p>
              <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleUpdatePrice(item.id)}>
                  Обновить цену
                </button>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="delete-button"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
