const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords:', {
      candidate: candidatePassword,
      hashed: this.password
    });
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Compare result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password compare error:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 