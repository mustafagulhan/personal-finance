const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (userData) => {
  try {
    // Email kontrolü
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    // Yeni kullanıcı oluşturma
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password // Şifre User modelinde hashlenecek
    });

    await user.save();

    // Token oluştur
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { 
      message: 'Kullanıcı başarıyla kaydedildi',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Register service error:', error);
    throw error;
  }
};

const login = async (credentials) => {
  try {
    const user = await User.findOne({ email: credentials.email });
    if (!user) {
      throw new Error('Email veya şifre hatalı');
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new Error('Email veya şifre hatalı');
    }

    // Token'ı düzgün formatta oluştur
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Generated token payload:', { id: user._id.toString(), email: user.email }); // Debug için

    return { 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

module.exports = {
  register,
  login
}; 