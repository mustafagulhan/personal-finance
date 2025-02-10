const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug için

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token); // Debug için

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug için

    // Token'dan gelen id'yi doğru şekilde al
    if (!decoded.id) {
      throw new Error('Geçersiz token yapısı');
    }

    req.user = {
      id: decoded.id
    };

    console.log('User set in request:', req.user); // Debug için
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token süresi dolmuş' });
    }
    res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
}; 