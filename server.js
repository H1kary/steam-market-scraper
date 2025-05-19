const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { Item } = require('./src/database');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Получение всех предметов
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Функция для извлечения appid и market_hash_name из ссылки
const parseSteamUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Проверяем, что это ссылка на Steam Market
    if (!urlObj.hostname.includes('steamcommunity.com') || !pathParts.includes('market')) {
      throw new Error('Неверная ссылка на Steam Market');
    }

    // Получаем appid и market_hash_name из пути
    const appid = pathParts[pathParts.indexOf('listings') + 1];
    const market_hash_name = pathParts[pathParts.indexOf('listings') + 2];
    
    if (!appid || !market_hash_name) {
      throw new Error('Неверный формат ссылки');
    }
    
    return { 
      appid, 
      market_hash_name: decodeURIComponent(market_hash_name)
    };
  } catch (error) {
    throw new Error('Неверный формат ссылки: ' + error.message);
  }
};

// Добавление нового предмета
app.post('/api/items', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Необходимо указать ссылку на предмет' });
    }

    // Извлекаем appid и market_hash_name из ссылки
    const { appid, market_hash_name } = parseSteamUrl(url);
    
    // Проверяем, существует ли уже такой предмет
    const existingItem = await Item.findOne({
      where: { appid, market_hash_name }
    });

    if (existingItem) {
      return res.status(400).json({ error: 'Этот предмет уже добавлен в отслеживание' });
    }

    // Получаем данные о цене
    const priceResponse = await axios.get('https://steamcommunity.com/market/priceoverview/', {
      params: {
        currency: 5,
        country: 'us',
        appid: appid,
        market_hash_name: market_hash_name,
        format: 'json'
      }
    });

    // Получаем страницу предмета для извлечения изображения
    const marketUrl = `https://steamcommunity.com/market/listings/${appid}/${market_hash_name}`;
    const marketResponse = await axios.get(marketUrl);
    const $ = cheerio.load(marketResponse.data);
    
    // Ищем изображение предмета
    const imageUrl = $('.market_listing_nav img').first().attr('src') || 
                    $('.market_listing_largeimage img').first().attr('src');

    // Создаем новый предмет в базе данных
    const newItem = await Item.create({
      appid,
      market_hash_name,
      lowest_price: priceResponse.data.lowest_price,
      median_price: priceResponse.data.median_price,
      volume: priceResponse.data.volume,
      imageUrl: imageUrl || null,
      lastUpdated: new Date().toLocaleString()
    });

    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление цены предмета
app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    const priceResponse = await axios.get('https://steamcommunity.com/market/priceoverview/', {
      params: {
        currency: 5,
        country: 'us',
        appid: item.appid,
        market_hash_name: item.market_hash_name,
        format: 'json'
      }
    });

    await item.update({
      lowest_price: priceResponse.data.lowest_price,
      median_price: priceResponse.data.median_price,
      volume: priceResponse.data.volume,
      lastUpdated: new Date().toLocaleString()
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление предмета
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    await item.destroy();
    res.json({ message: 'Предмет успешно удален' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Прокси-сервер запущен на порту ${port}`);
}); 