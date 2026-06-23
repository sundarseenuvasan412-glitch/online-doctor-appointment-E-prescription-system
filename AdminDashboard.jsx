import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Avatar,
  IconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import axios from 'axios';

const defaultDoctorForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  qualifications: '',
  experienceYears: '',
  bio: '',
  clinicName: '',
  consultationFee: '',
  image: '',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(defaultDoctorForm);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get('/admin/stats');
      setStats(data);
    } catch {
      setError('Could not load stats');
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await axios.get('/admin/doctors');
      setDoctors(data);
    } catch {
      setError('Could not load doctors');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchStats(), fetchDoctors()]);
      setLoading(false);
    };
    load();
  }, [fetchStats, fetchDoctors]);

  const openAdd = () => {
    setForm(defaultDoctorForm);
    setFormError('');
    setAddOpen(true);
  };

  const openEdit = (doctor) => {
    setEditingId(doctor._id);
    setForm({
      name: doctor.user?.name || '',
      email: doctor.user?.email || '',
      password: '',
      phone: doctor.user?.phone || '',
      specialization: doctor.specialization || '',
      qualifications: doctor.qualifications || '',
      experienceYears: doctor.experienceYears ?? '',
      bio: doctor.bio || '',
      clinicName: doctor.clinicName || '',
      consultationFee: doctor.consultationFee ?? '',
      image: doctor.image || '',
    });
    setFormError('');
    setEditOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password || form.password.length < 6 || !form.specialization) {
      setFormError('Name, email, password (min 6), and specialization are required.');
      return;
    }
    setSubmitLoading(true);
    try {
      await axios.post('/auth/doctors', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        specialization: form.specialization,
        qualifications: form.qualifications || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        bio: form.bio || undefined,
        clinicName: form.clinicName || undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        image: form.image || undefined,
      });
      setSnack({ open: true, message: 'Doctor added successfully', severity: 'success' });
      setAddOpen(false);
      fetchStats();
      fetchDoctors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);
    try {
      await axios.patch(`/admin/doctors/${editingId}`, {
        specialization: form.specialization || undefined,
        qualifications: form.qualifications || undefined,
        experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
        bio: form.bio || undefined,
        clinicName: form.clinicName || undefined,
        consultationFee: form.consultationFee !== '' ? Number(form.consultationFee) : undefined,
        image: form.image || undefined,
      });
      setSnack({ open: true, message: 'Doctor updated successfully', severity: 'success' });
      setEditOpen(false);
      fetchDoctors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update doctor');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: 'primary.main' }}><PersonIcon sx={{ fontSize: 40 }} /></Box>
              <Box>
                <Typography color="text.secondary" variant="body2">Patients</Typography>
                <Typography variant="h5" fontWeight={700}>{stats?.patients ?? 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: 'primary.main' }}><MedicalServicesIcon sx={{ fontSize: 40 }} /></Box>
              <Box>
                <Typography color="text.secondary" variant="body2">Doctors</Typography>
                <Typography variant="h5" fontWeight={700}>{stats?.doctors ?? 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: 'primary.main' }}><CalendarMonthIcon sx={{ fontSize: 40 }} /></Box>
              <Box>
                <Typography color="text.secondary" variant="body2">Total Appointments</Typography>
                <Typography variant="h5" fontWeight={700}>{stats?.appointments ?? 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: 'primary.main' }}><GroupIcon sx={{ fontSize: 40 }} /></Box>
              <Box>
                <Typography color="text.secondary" variant="body2">Upcoming</Typography>
                <Typography variant="h5" fontWeight={700}>{stats?.upcomingAppointments ?? 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Doctors section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Doctors
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Add Doctor
        </Button>
      </Box>

      {doctors.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No doctors yet. Add one to get started.</Typography>
            <Button variant="contained" sx={{ mt: 2, textTransform: 'none' }} onClick={openAdd}>Add Doctor</Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar
                      src={doc.image}
                      sx={{ width: 72, height: 72 }}
                    >
                      {(doc.user?.name || 'D')[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {doc.user?.name || 'Doctor'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{doc.user?.email}</Typography>
                      <Chip size="small" label={doc.specialization} sx={{ mt: 0.5 }} color="primary" variant="outlined" />
                    </Box>
                    <IconButton size="small" onClick={() => openEdit(doc)} aria-label="Edit doctor">
                      <EditIcon />
                    </IconButton>
                  </Box>
                  {doc.qualifications && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {doc.qualifications}
                    </Typography>
                  )}
                  {doc.experienceYears > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {doc.experienceYears} years experience
                    </Typography>
                  )}
                  {doc.clinicName && (
                    <Typography variant="body2" color="text.secondary">
                      {doc.clinicName}
                    </Typography>
                  )}
                  {doc.consultationFee > 0 && (
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                      ₹{doc.consultationFee} consultation
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Doctor Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Doctor</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box component="form" onSubmit={handleAddSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Doctor image URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." fullWidth />
            <TextField label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required fullWidth />
            <TextField label="Password (min 6)" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required fullWidth />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} fullWidth />
            <TextField label="Specialization" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} required placeholder="e.g. Cardiologist" fullWidth />
            <TextField label="Qualifications" value={form.qualifications} onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))} placeholder="e.g. MBBS, MD" fullWidth />
            <TextField label="Experience (years)" type="number" value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} inputProps={{ min: 0 }} fullWidth />
            <TextField label="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} multiline rows={2} fullWidth />
            <TextField label="Clinic name" value={form.clinicName} onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))} fullWidth />
            <TextField label="Consultation fee (₹)" type="number" value={form.consultationFee} onChange={(e) => setForm((f) => ({ ...f, consultationFee: e.target.value }))} inputProps={{ min: 0 }} fullWidth />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitLoading} sx={{ textTransform: 'none' }}>
                {submitLoading ? 'Adding…' : 'Add Doctor'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Doctor</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box component="form" onSubmit={handleEditSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Doctor image URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} fullWidth />
            <TextField label="Full name" value={form.name} disabled fullWidth />
            <TextField label="Email" value={form.email} disabled fullWidth />
            <TextField label="Specialization" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} fullWidth />
            <TextField label="Qualifications" value={form.qualifications} onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))} fullWidth />
            <TextField label="Experience (years)" type="number" value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} inputProps={{ min: 0 }} fullWidth />
            <TextField label="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} multiline rows={2} fullWidth />
            <TextField label="Clinic name" value={form.clinicName} onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))} fullWidth />
            <TextField label="Consultation fee (₹)" type="number" value={form.consultationFee} onChange={(e) => setForm((f) => ({ ...f, consultationFee: e.target.value }))} inputProps={{ min: 0 }} fullWidth />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitLoading} sx={{ textTransform: 'none' }}>
                {submitLoading ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} message={snack.message} />
    </Box>
  );
}
