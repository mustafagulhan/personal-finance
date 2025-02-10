# Kişisel Finans Yönetim Sistemi

Gelir ve giderlerinizi takip edebileceğiniz, raporlar oluşturabileceğiniz ve belgelerinizi yönetebileceğiniz bir web uygulaması.

## Özellikler

- ��� Gelir/Gider takibi
- ��� Detaylı raporlar ve grafikler
- ��� Belge yönetimi
- ��� Karanlık/Aydınlık tema
- ��� Responsive tasarım

## Teknolojiler

### Frontend
- React
- Material-UI
- Axios
- Recharts

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

## Kurulum

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd personal-finance
npm install
npm start
```

## Ortam Değişkenleri

Backend için `.env` dosyası oluşturun:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```