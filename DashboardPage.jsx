import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const toList = (s) =>
  String(s || '')
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);

export default function DashboardPage() {
  const { user, socket } = useAuth();
  const isLive = socket?.connected ?? false;
  const [mhOpen, setMhOpen] = useState(false);
  const [mhLoading, setMhLoading] = useState(false);
  const [mhSaving, setMhSaving] = useState(false);
  const [mhError, setMhError] = useState('');
  const [mh, setMh] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [doctorCounts, setDoctorCounts] = useState(null);
  const [doctorCountsError, setDoctorCountsError] = useState('');
  const [patientSummary, setPatientSummary] = useState(null);
  const [patientSummaryError, setPatientSummaryError] = useState('');

  const openMedicalHistory = async () => {
    setMhOpen(true);
    setMhError('');
    setMhLoading(true);
    try {
      const { data } = await axios.get('/medical-history/me');
      setMh(data);
    } catch (err) {
      setMhError(err.response?.data?.message || 'Could not load medical history.');
    } finally {
      setMhLoading(false);
    }
  };

  const saveMedicalHistory = async (e) => {
    e?.preventDefault();
    if (!mh) return;
    setMhSaving(true);
    setMhError('');
    try {
      const payload = {
        bloodGroup: mh.bloodGroup || '',
        heightCm: mh.heightCm ?? '',
        weightKg: mh.weightKg ?? '',
        allergies: toList(mh.allergiesText),
        chronicConditions: toList(mh.chronicConditionsText),
        currentMedications: toList(mh.currentMedicationsText),
        pastSurgeries: toList(mh.pastSurgeriesText),
        notes: mh.notes || '',
        emergencyContact: {
          name: mh.emergencyContact?.name || '',
          phone: mh.emergencyContact?.phone || '',
          relationship: mh.emergencyContact?.relationship || '',
        },
      };
      const { data } = await axios.put('/medical-history/me', payload);
      setMh((prev) => ({
        ...data,
        allergiesText: (data.allergies || []).join(', '),
        chronicConditionsText: (data.chronicConditions || []).join(', '),
        currentMedicationsText: (data.currentMedications || []).join(', '),
        pastSurgeriesText: (data.pastSurgeries || []).join(', '),
      }));
      setSnack({ open: true, message: 'Medical history saved', severity: 'success' });
      setMhOpen(false);
    } catch (err) {
      setMhError(err.response?.data?.message || 'Could not save medical history.');
    } finally {
      setMhSaving(false);
    }
  };

  useEffect(() => {
    if (!mhOpen || !mh) return;
    setMh((prev) => ({
      ...prev,
      allergiesText: prev.allergiesText ?? (prev.allergies || []).join(', '),
      chronicConditionsText: prev.chronicConditionsText ?? (prev.chronicConditions || []).join(', '),
      currentMedicationsText: prev.currentMedicationsText ?? (prev.currentMedications || []).join(', '),
      pastSurgeriesText: prev.pastSurgeriesText ?? (prev.pastSurgeries || []).join(', '),
      emergencyContact: prev.emergencyContact || { name: '', phone: '', relationship: '' },
    }));
  }, [mhOpen, mh]);

  const fetchDoctorCounts = useCallback(async () => {
    if (user?.role !== 'doctor') return;
    try {
      const { data } = await axios.get('/appointments/mine');
      const upcomingStatuses = ['pending', 'approved', 'scheduled'];
      const upcoming = data.filter((a) => upcomingStatuses.includes(a.status)).length;
      const completed = data.filter((a) => a.status === 'completed').length;
      setDoctorCounts({ upcoming, completed, total: data.length });
      setDoctorCountsError('');
    } catch (err) {
      setDoctorCountsError('Could not load your appointment summary.');
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDoctorCounts();
  }, [fetchDoctorCounts]);

  const fetchPatientSummary = useCallback(async () => {
    if (user?.role !== 'patient') return;
    try {
      const { data } = await axios.get('/appointments/mine');
      if (!Array.isArray(data) || data.length === 0) {
        setPatientSummary(null);
        setPatientSummaryError('');
        return;
      }

      const completed = data.filter((a) => a.status === 'completed');
      let lastCompleted = null;
      if (completed.length > 0) {
        lastCompleted = completed.reduce((latest, current) =>
          new Date(current.date) > new Date(latest.date) ? current : latest
        );
      }

      const upcomingStatuses = ['pending', 'approved', 'scheduled'];
      const now = new Date();
      const upcomingList = data.filter(
        (a) =>
          upcomingStatuses.includes(a.status) &&
          new Date(a.date).getTime() >= now.setHours(0, 0, 0, 0)
      );
      let upcoming = null;
      if (upcomingList.length > 0) {
        upcoming = upcomingList.reduce((soonest, current) =>
          new Date(current.date) < new Date(soonest.date) ? current : soonest
        );
      }

      let followUpDate = null;
      if (lastCompleted) {
        try {
          const res = await axios.get(`/prescriptions/by-appointment/${lastCompleted._id}`);
          followUpDate = res.data?.followUpDate || null;
        } catch {
          followUpDate = null;
        }
      }

      setPatientSummary({
        lastDoctorName:
          lastCompleted?.doctor?.user?.name ||
          lastCompleted?.doctor?.name ||
          (lastCompleted ? 'Doctor' : null),
        lastDate: lastCompleted?.date || null,
        lastTimeSlot: lastCompleted?.timeSlot || null,
        followUpDate,
        upcomingDate: upcoming?.date || null,
        upcomingTimeSlot: upcoming?.timeSlot || null,
      });
      setPatientSummaryError('');
    } catch (err) {
      setPatientSummaryError('Could not load your recent appointment details.');
      setPatientSummary(null);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchPatientSummary();
  }, [fetchPatientSummary]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          {user?.role === 'doctor' ? 'Doctor dashboard' : 'Welcome,'}{' '}
          {user?.role === 'doctor' ? user?.name : user?.name || user?.email}
        </Typography>
        {isLive && (
          <Chip
            size="small"
            icon={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
                }}
              />
            }
            label="Real-time connected"
            color="success"
            sx={{ '& .MuiChip-icon': { ml: 0.5 } }}
          />
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {user?.role === 'doctor'
          ? 'Overview of your upcoming and completed consultations.'
          : 'You’ll get live updates here when your appointment status changes.'}
      </Typography>

      {user?.role === 'doctor' && (
        <>
          {/* Doctor profile card */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Doctor profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Basic details for your account.
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> Dr. {user?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {user?.email}
              </Typography>
              {user?.phone && (
                <Typography variant="body2">
                  <strong>Phone:</strong> {user.phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Doctor counts card */}
          <Card sx={{ mb: 2 }}>
            <CardContent
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Patient summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overview of upcoming and completed consultations.
                </Typography>
                {doctorCountsError && (
                  <Typography variant="caption" color="error">
                    {doctorCountsError}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Upcoming patients
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {doctorCounts?.upcoming ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Completed patients
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {doctorCounts?.completed ?? 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {user?.role === 'patient' && (
        <Card sx={{ mt: 2 }}>
          <CardContent
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <MedicalInformationIcon color="primary" sx={{ fontSize: 40, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Medical history
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Summary of your saved health details.
                </Typography>
                {mh ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      <strong>Blood group:</strong> {mh.bloodGroup || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Allergies:</strong>{' '}
                      {(mh.allergies && mh.allergies.length > 0 && mh.allergies.join(', ')) || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Chronic conditions:</strong>{' '}
                      {(mh.chronicConditions &&
                        mh.chronicConditions.length > 0 &&
                        mh.chronicConditions.join(', ')) ||
                        '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Current medications:</strong>{' '}
                      {(mh.currentMedications &&
                        mh.currentMedications.length > 0 &&
                        mh.currentMedications.join(', ')) ||
                        '—'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medical history saved yet. Click edit to add details.
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              onClick={openMedicalHistory}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Edit
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.role === 'patient' && (
        <Card sx={{ mt: 2 }}>
          <CardContent
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarMonthIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Last consultation & upcoming visit
                </Typography>
                {patientSummaryError ? (
                  <Typography variant="body2" color="error">
                    {patientSummaryError}
                  </Typography>
                ) : patientSummary ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last consulted doctor:</strong>{' '}
                      {patientSummary.lastDoctorName || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last visit date:</strong>{' '}
                      {patientSummary.lastDate
                        ? new Date(patientSummary.lastDate).toLocaleDateString('en-IN')
                        : '—'}{' '}
                      {patientSummary.lastTimeSlot || ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Follow-up date:</strong>{' '}
                      {patientSummary.followUpDate
                        ? new Date(patientSummary.followUpDate).toLocaleDateString('en-IN')
                        : '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Upcoming appointment:</strong>{' '}
                      {patientSummary.upcomingDate
                        ? `${new Date(
                            patientSummary.upcomingDate
                          ).toLocaleDateString('en-IN')} · ${
                            patientSummary.upcomingTimeSlot || ''
                          }`
                        : '—'}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No consultation history yet. Book your first appointment to see details here.
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              component={Link}
              to="/appointments"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Go to appointments
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={mhOpen} onClose={() => (!mhSaving ? setMhOpen(false) : null)} maxWidth="sm" fullWidth>
        <DialogTitle>Medical history</DialogTitle>
        <DialogContent>
          {mhError && <Alert severity="error" sx={{ mb: 2 }}>{mhError}</Alert>}
          {mhLoading ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Loading…
            </Typography>
          ) : (
            <Box component="form" onSubmit={saveMedicalHistory} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Blood group"
                  value={mh?.bloodGroup || ''}
                  onChange={(e) => setMh((x) => ({ ...x, bloodGroup: e.target.value }))}
                />
                <TextField
                  label="Height (cm)"
                  type="number"
                  value={mh?.heightCm ?? ''}
                  onChange={(e) => setMh((x) => ({ ...x, heightCm: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={mh?.weightKg ?? ''}
                  onChange={(e) => setMh((x) => ({ ...x, weightKg: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
              </Box>

              <TextField
                label="Allergies (comma or new line separated)"
                multiline
                minRows={2}
                value={mh?.allergiesText || ''}
                onChange={(e) => setMh((x) => ({ ...x, allergiesText: e.target.value }))}
              />
              <TextField
                label="Chronic conditions"
                multiline
                minRows={2}
                value={mh?.chronicConditionsText || ''}
                onChange={(e) => setMh((x) => ({ ...x, chronicConditionsText: e.target.value }))}
              />
              <TextField
                label="Current medications"
                multiline
                minRows={2}
                value={mh?.currentMedicationsText || ''}
                onChange={(e) => setMh((x) => ({ ...x, currentMedicationsText: e.target.value }))}
              />
              <TextField
                label="Past surgeries"
                multiline
                minRows={2}
                value={mh?.pastSurgeriesText || ''}
                onChange={(e) => setMh((x) => ({ ...x, pastSurgeriesText: e.target.value }))}
              />
              <TextField
                label="Notes"
                multiline
                minRows={2}
                value={mh?.notes || ''}
                onChange={(e) => setMh((x) => ({ ...x, notes: e.target.value }))}
              />

              <Typography variant="subtitle2" fontWeight={700}>
                Emergency contact (optional)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Name"
                  value={mh?.emergencyContact?.name || ''}
                  onChange={(e) =>
                    setMh((x) => ({
                      ...x,
                      emergencyContact: { ...(x.emergencyContact || {}), name: e.target.value },
                    }))
                  }
                />
                <TextField
                  label="Phone"
                  value={mh?.emergencyContact?.phone || ''}
                  onChange={(e) =>
                    setMh((x) => ({
                      ...x,
                      emergencyContact: { ...(x.emergencyContact || {}), phone: e.target.value },
                    }))
                  }
                />
                <TextField
                  label="Relationship"
                  value={mh?.emergencyContact?.relationship || ''}
                  onChange={(e) =>
                    setMh((x) => ({
                      ...x,
                      emergencyContact: { ...(x.emergencyContact || {}), relationship: e.target.value },
                    }))
                  }
                  sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button onClick={() => setMhOpen(false)} disabled={mhSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={mhSaving} sx={{ textTransform: 'none' }}>
                  {mhSaving ? 'Saving…' : 'Save'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.message}
      />
    </Box>
  );
}
