import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Stack,
  IconButton,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const ReportDialog = ({ open, onClose, onDownload }) => {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeTypes: {
      income: true,
      expense: true,
      vault: false
    }
  });

  const handleSubmit = () => {
    const types = [];
    if (filters.includeTypes.income) types.push('income');
    if (filters.includeTypes.expense) types.push('expense');
    if (filters.includeTypes.vault) {
      types.push('vault-in', 'vault-out');
    }
    onDownload({
      startDate: filters.startDate,
      endDate: filters.endDate,
      types
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Rapor İndir
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Bitiş Tarihi"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.includeTypes.income}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    includeTypes: { ...prev.includeTypes, income: e.target.checked }
                  }))}
                />
              }
              label="Gelirler"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.includeTypes.expense}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    includeTypes: { ...prev.includeTypes, expense: e.target.checked }
                  }))}
                />
              }
              label="Giderler"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.includeTypes.vault}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    includeTypes: { ...prev.includeTypes, vault: e.target.checked }
                  }))}
                />
              }
              label="Kasa İşlemleri"
            />
          </FormGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained">
          İndir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog; 