import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  TextField, 
  DialogActions, 
  Button, 
  Alert,
  Typography,
  Box 
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const VaultForm = ({ open, handleClose, onVaultUpdated }) => {
  const { token } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [netBalance, setNetBalance] = useState(0);

  // Net bakiyeyi hesapla
  useEffect(() => {
    const fetchNetBalance = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const balance = response.data.reduce((acc, curr) => {
          if (curr.type === 'income') return acc + curr.amount;
          if (curr.type === 'expense' && !curr.isVaultTransaction) return acc - curr.amount; // Normal giderleri düş
          return acc;
        }, 0);

        setNetBalance(balance);
      } catch (error) {
        console.error('Net balance fetch error:', error);
        setError('Net bakiye hesaplanırken bir hata oluştu');
      }
    };

    fetchNetBalance();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Tutar kontrolü
    const numAmount = parseFloat(amount);
    if (numAmount > netBalance) {
      setError(`Yetersiz bakiye. Mevcut net bakiye: ₺${netBalance.toFixed(2)}`);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/vault/deposit',
        { amount: numAmount },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      onVaultUpdated(response.data);
      handleClose();
      setAmount('');
    } catch (error) {
      console.error('Vault deposit error:', error);
      if (error.response?.data?.message === 'Yetersiz bakiye') {
        setError(`Yetersiz bakiye. Mevcut net bakiye: ₺${error.response.data.netBalance.toFixed(2)}`);
      } else {
        setError(error.response?.data?.message || 'Para eklenirken bir hata oluştu');
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Kasaya Para Ekle</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mevcut Net Bakiye: ₺{netBalance.toFixed(2)}
          </Typography>

          <TextField
            label="Tutar"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0, step: "0.01" }}
            error={parseFloat(amount) > netBalance}
            helperText={parseFloat(amount) > netBalance ? 'Tutar net bakiyeden fazla olamaz' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > netBalance}
          >
            Ekle
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VaultForm; 