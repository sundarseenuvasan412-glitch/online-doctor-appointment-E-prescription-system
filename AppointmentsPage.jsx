import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Snackbar,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const statusColor = {
  pending: 'warning',
  approved: 'info',
  scheduled: 'primary',
  rejected: 'error',
  completed: 'success',
  cancelled: 'default',
};

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AppointmentsPage() {
  const { user, socket } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookOpen, setBookOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [rxOpen, setRxOpen] = useState(false);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState('');
  const [rxAppointmentId, setRxAppointmentId] = useState(null);
  const [rxData, setRxData] = useState(null);
  const [rxCreateOpen, setRxCreateOpen] = useState(false);
  const [rxCreateFor, setRxCreateFor] = useState(null);
  const [rxCreateLoading, setRxCreateLoading] = useState(false);
  const [rxCreateError, setRxCreateError] = useState('');
  const [rxForm, setRxForm] = useState({
    diagnosis: '',
    advice: '',
    followUpDate: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
  });
  const [doctors, setDoctors] = useState([]);
  const [bookForm, setBookForm] = useState({ doctorId: '', date: '', timeSlot: '', reason: '', mode: 'in-person' });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const [mhOpen, setMhOpen] = useState(false);
  const [mhLoading, setMhLoading] = useState(false);
  const [mhError, setMhError] = useState('');
  const [mhData, setMhData] = useState(null);
  const [mhPatientName, setMhPatientName] = useState('');
  const [slotOptions, setSlotOptions] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availability, setAvailability] = useState(
    Array.from({ length: 7 }, (_, day) => ({ dayOfWeek: day, slots: [] }))
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [aiTriageInput, setAiTriageInput] = useState('');
  const [aiTriageReply, setAiTriageReply] = useState('');
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [aiTriageError, setAiTriageError] = useState('');

  const openPatientHistory = async (apt) => {
    const patientId = apt?.patient?._id;
    if (!patientId) return;
    setMhPatientName(apt?.patient?.name || 'Patient');
    setMhOpen(true);
    setMhLoading(true);
    setMhError('');
    setMhData(null);
    try {
      const { data } = await axios.get(`/medical-history/patient/${patientId}`);
      setMhData(data);
    } catch (err) {
      setMhError(err.response?.data?.message || 'Could not load medical history.');
    } finally {
      setMhLoading(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const { data } = await axios.get('/appointments/mine');
      setAppointments(data);
      setError('');
    } catch (err) {
      setError('Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(
    async (doctorId, date) => {
      if (!doctorId || !date) {
        setSlotOptions([]);
        setSlotError('');
        return;
      }
      setSlotLoading(true);
      setSlotError('');
      try {
        const { data } = await axios.get(`/doctors/${doctorId}/slots`, {
          params: { date },
        });
        setSlotOptions(data.slots || []);
      } catch (err) {
        setSlotError(err.response?.data?.message || 'Could not load slots for this date.');
        setSlotOptions([]);
      } finally {
        setSlotLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!socket || user?.role !== 'patient') return;
    const onUpdate = () => {
      setSnack({ open: true, message: 'Appointment updated in real time', severity: 'success' });
      fetchAppointments();
    };
    socket.on('appointment:updated', onUpdate);
    return () => socket.off('appointment:updated', onUpdate);
  }, [socket, user?.role, fetchAppointments]);

  useEffect(() => {
    if (!socket || user?.role !== 'doctor') return;
    const onNew = () => {
      setSnack({ open: true, message: 'New appointment received', severity: 'success' });
      fetchAppointments();
    };
    const onUpdate = () => fetchAppointments();
    socket.on('appointment:new', onNew);
    socket.on('appointment:updated', onUpdate);
    return () => {
      socket.off('appointment:new', onNew);
      socket.off('appointment:updated', onUpdate);
    };
  }, [socket, user?.role, fetchAppointments]);

  useEffect(() => {
    if (!socket || user?.role !== 'patient') return;
    const onRx = () => {
      setSnack({ open: true, message: 'Prescription added in real time', severity: 'success' });
    };
    socket.on('prescription:new', onRx);
    return () => socket.off('prescription:new', onRx);
  }, [socket, user?.role]);

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.patch(`/appointments/${appointmentId}/status`, { status });
      setSnack({ open: true, message: `Appointment ${status}`, severity: 'success' });
      fetchAppointments();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to update status', severity: 'error' });
    }
  };

  const openPay = (apt) => {
    setPayingId(apt._id);
    setPayError('');
    setPayOpen(true);
  };

  const confirmPay = async () => {
    if (!payingId) return;
    setPayLoading(true);
    setPayError('');
    try {
      await axios.post(`/appointments/${payingId}/pay`);
      setSnack({ open: true, message: 'Payment successful. Appointment scheduled.', severity: 'success' });
      setPayOpen(false);
      setPayingId(null);
      fetchAppointments();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const openPrescription = async (apt) => {
    setRxOpen(true);
    setRxAppointmentId(apt._id);
    setRxData(null);
    setRxError('');
    setRxLoading(true);
    try {
      const { data } = await axios.get(`/prescriptions/by-appointment/${apt._id}`);
      setRxData(data);
    } catch (err) {
      setRxError(err.response?.data?.message || 'Prescription not found for this appointment.');
    } finally {
      setRxLoading(false);
    }
  };

  const downloadPrescriptionPdf = async () => {
    if (!rxData?._id) return;
    try {
      const res = await axios.get(`/prescriptions/${rxData._id}/pdf`, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `prescription-${rxData._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Download failed', severity: 'error' });
    }
  };

  const openCreatePrescription = (apt) => {
    setRxCreateFor(apt);
    setRxCreateError('');
    setRxForm({
      diagnosis: '',
      advice: '',
      followUpDate: '',
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
    });
    setRxCreateOpen(true);
  };

  const submitCreatePrescription = async (e) => {
    e?.preventDefault();
    if (!rxCreateFor?._id) return;

    const medicines = (rxForm.medicines || [])
      .map((m) => ({
        name: (m.name || '').trim(),
        dosage: (m.dosage || '').trim(),
        frequency: (m.frequency || '').trim(),
        duration: (m.duration || '').trim(),
        notes: (m.notes || '').trim() || undefined,
      }))
      .filter((m) => m.name && m.dosage && m.frequency && m.duration);

    if (!rxForm.diagnosis.trim() || medicines.length === 0) {
      setRxCreateError('Diagnosis and at least one complete medicine row are required.');
      return;
    }

    setRxCreateLoading(true);
    setRxCreateError('');
    try {
      await axios.post('/prescriptions', {
        appointmentId: rxCreateFor._id,
        diagnosis: rxForm.diagnosis.trim(),
        medicines,
        advice: rxForm.advice.trim() || undefined,
        followUpDate: rxForm.followUpDate ? new Date(rxForm.followUpDate).toISOString() : undefined,
      });
      setSnack({ open: true, message: 'Prescription sent to patient in real time', severity: 'success' });
      setRxCreateOpen(false);
      setRxCreateFor(null);
    } catch (err) {
      setRxCreateError(err.response?.data?.message || 'Failed to create prescription.');
    } finally {
      setRxCreateLoading(false);
    }
  };

  const getStatusLabel = (apt) => {
    if (apt.status === 'approved' && apt.paymentStatus !== 'success' && user?.role === 'patient') {
      return 'accepted (payment pending)';
    }
    if (apt.status === 'scheduled') return 'scheduled';
    return apt.status || 'pending';
  };

  const openBook = async () => {
    setBookOpen(true);
    setBookForm({ doctorId: '', date: '', timeSlot: '', reason: '', mode: 'in-person' });
    setSlotOptions([]);
    setSlotError('');
    setBookError('');
    try {
      const { data } = await axios.get('/appointments/doctors');
      setDoctors(data);
    } catch {
      setBookError('Could not load doctors.');
    }
  };

  useEffect(() => {
    if (!bookOpen) return;
    if (!bookForm.doctorId || !bookForm.date) {
      setSlotOptions([]);
      setSlotError('');
      return;
    }
    fetchSlots(bookForm.doctorId, bookForm.date);
  }, [bookOpen, bookForm.doctorId, bookForm.date, fetchSlots]);

  const handleBook = async (e) => {
    e?.preventDefault();
    if (!bookForm.doctorId || !bookForm.date || !bookForm.timeSlot) {
      setBookError('Please select doctor, date and time.');
      return;
    }
    setBookLoading(true);
    setBookError('');
    try {
      await axios.post('/appointments', {
        doctorId: bookForm.doctorId,
        date: bookForm.date,
        timeSlot: bookForm.timeSlot,
        reason: bookForm.reason || 'Consultation',
        mode: bookForm.mode,
      });
      setSnack({ open: true, message: 'Appointment booked successfully', severity: 'success' });
      setBookOpen(false);
      fetchAppointments();
    } catch (err) {
      setBookError(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBookLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!availabilityOpen || user?.role !== 'doctor') return;
    const load = async () => {
      setAvailabilityLoading(true);
      try {
        const { data } = await axios.get('/doctors/me/availability');
        const base = Array.from({ length: 7 }, (_, day) => ({ dayOfWeek: day, slots: [] }));
        (data || []).forEach((d) => {
          if (
            Number.isInteger(d.dayOfWeek) &&
            d.dayOfWeek >= 0 &&
            d.dayOfWeek <= 6 &&
            Array.isArray(d.slots)
          ) {
            base[d.dayOfWeek].slots = d.slots;
          }
        });
        setAvailability(base);
      } catch (err) {
        setSnack({
          open: true,
          message: err.response?.data?.message || 'Could not load availability.',
          severity: 'error',
        });
      } finally {
        setAvailabilityLoading(false);
      }
    };
    load();
  }, [availabilityOpen, user?.role]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          My appointments
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user?.role === 'doctor' && (
            <Button
              variant="outlined"
              onClick={() => setAvailabilityOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Manage availability
            </Button>
          )}
          {user?.role === 'patient' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openBook}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Book appointment
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No appointments yet. Book your first visit when you’re ready.
            </Typography>
            {user?.role === 'patient' && (
              <Button variant="contained" sx={{ mt: 2, textTransform: 'none' }} onClick={openBook}>
                Book appointment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map((apt) => (
            <Card key={apt._id}>
              <CardContent sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {user?.role === 'patient'
                      ? apt.doctor?.user?.name || 'Doctor'
                      : apt.patient?.name || 'Patient'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(apt.date)} · {apt.timeSlot}
                    {apt.reason && ` · ${apt.reason}`}
                    {apt.paymentAmount && (
                      <> · ₹{apt.paymentAmount} ({apt.paymentStatus || 'pending'})</>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Chip
                    label={getStatusLabel(apt)}
                    color={statusColor[apt.status] || 'default'}
                    size="small"
                  />

                  {user?.role === 'doctor' && apt.status === 'pending' && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => updateAppointmentStatus(apt._id, 'rejected')}
                        sx={{ textTransform: 'none' }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => updateAppointmentStatus(apt._id, 'approved')}
                        sx={{ textTransform: 'none' }}
                      >
                        Accept
                      </Button>
                    </>
                  )}

                  {user?.role === 'patient' && apt.status === 'approved' && apt.paymentStatus !== 'success' && (
                    <Button size="small" variant="contained" onClick={() => openPay(apt)} sx={{ textTransform: 'none' }}>
                      Pay now
                    </Button>
                  )}

                  {user?.role === 'patient' && (
                    <Button size="small" variant="outlined" onClick={() => openPrescription(apt)} sx={{ textTransform: 'none' }}>
                      Prescription
                    </Button>
                  )}

                  {user?.role === 'doctor' &&
                    ['scheduled', 'completed'].includes(apt.status) &&
                    apt.paymentStatus === 'success' && (
                    <Button size="small" variant="outlined" onClick={() => openCreatePrescription(apt)} sx={{ textTransform: 'none' }}>
                      Add prescription
                    </Button>
                  )}

                  {user?.role === 'doctor' && (
                    <Button size="small" variant="outlined" onClick={() => openPatientHistory(apt)} sx={{ textTransform: 'none' }}>
                      Patient history
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book appointment</DialogTitle>
        <DialogContent>
          {bookError && <Alert severity="error" sx={{ mb: 2 }}>{bookError}</Alert>}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 1,
            }}
          >
            {user?.role === 'patient' && (
              <Card variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    AI visit helper (optional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Describe your symptoms in 1–2 lines. I will suggest which type of doctor to see and how urgent it may be.
                    This is not a diagnosis.
                  </Typography>
                  <TextField
                    label="Your symptoms"
                    multiline
                    minRows={2}
                    fullWidth
                    value={aiTriageInput}
                    onChange={(e) => setAiTriageInput(e.target.value)}
                    placeholder="E.g. severe headache with nausea since yesterday"
                  />
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={aiTriageLoading || !aiTriageInput.trim()}
                      sx={{ textTransform: 'none' }}
                      onClick={async () => {
                        if (!aiTriageInput.trim()) return;
                        setAiTriageLoading(true);
                        setAiTriageError('');
                        setAiTriageReply('');
                        try {
                          const { data } = await axios.post('/chatbot/triage', {
                            message: aiTriageInput.trim(),
                            history: [],
                          });
                          setAiTriageReply(data.reply || '');
                        } catch (err) {
                          setAiTriageError(
                            err.response?.data?.message ||
                              'AI triage is unavailable right now. Please continue with manual booking.'
                          );
                        } finally {
                          setAiTriageLoading(false);
                        }
                      }}
                    >
                      {aiTriageLoading ? 'Thinking…' : 'Suggest doctor & urgency'}
                    </Button>
                    {aiTriageLoading && <CircularProgress size={18} />}
                  </Box>
                  {aiTriageError && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {aiTriageError}
                    </Alert>
                  )}
                  {aiTriageReply && !aiTriageError && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {aiTriageReply}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Box component="form" onSubmit={handleBook} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={bookForm.doctorId}
                label="Doctor"
                onChange={(e) => setBookForm((f) => ({ ...f, doctorId: e.target.value }))}
              >
                {doctors.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.user?.name} — {d.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              required
              fullWidth
              inputProps={{ min: minDate }}
              value={bookForm.date}
              onChange={(e) => setBookForm((f) => ({ ...f, date: e.target.value }))}
            />
            <FormControl fullWidth required disabled={!bookForm.doctorId || !bookForm.date || slotLoading}>
              <InputLabel>Time slot</InputLabel>
              <Select
                value={bookForm.timeSlot}
                label="Time slot"
                onChange={(e) => setBookForm((f) => ({ ...f, timeSlot: e.target.value }))}
                displayEmpty
              >
                {slotOptions.length === 0 && !slotLoading && (
                  <MenuItem value="">
                    {slotError || 'No slots available for this day'}
                  </MenuItem>
                )}
                {slotOptions
                  .filter((s) => !s.booked)
                  .map((s) => (
                    <MenuItem key={s.timeSlot} value={s.timeSlot}>
                      {s.timeSlot}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Reason (optional)"
              fullWidth
              value={bookForm.reason}
              onChange={(e) => setBookForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. General checkup"
            />
            <FormControl fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select
                value={bookForm.mode}
                label="Mode"
                onChange={(e) => setBookForm((f) => ({ ...f, mode: e.target.value }))}
              >
                <MenuItem value="in-person">In-person</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setBookOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={bookLoading} sx={{ textTransform: 'none' }}>
                {bookLoading ? 'Booking…' : 'Book'}
              </Button>
            </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onClose={() => (!payLoading ? setPayOpen(false) : null)} maxWidth="xs" fullWidth>
        <DialogTitle>Payment</DialogTitle>
        <DialogContent>
          {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This is a dummy payment gateway. Click “Pay” to mark payment as successful and schedule the appointment.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setPayOpen(false)} disabled={payLoading}>Cancel</Button>
            <Button variant="contained" onClick={confirmPay} disabled={payLoading} sx={{ textTransform: 'none' }}>
              {payLoading ? 'Paying…' : 'Pay'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={rxOpen} onClose={() => setRxOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Prescription</DialogTitle>
        <DialogContent>
          {rxLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : rxError ? (
            <Alert severity="info">{rxError}</Alert>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Diagnosis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {rxData?.diagnosis || '—'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Medicines
              </Typography>
              {(rxData?.medicines || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No medicines listed.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {rxData.medicines.map((m, idx) => (
                    <Card key={`${m.name}-${idx}`} variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography fontWeight={700}>
                          {idx + 1}. {m.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {m.dosage} · {m.frequency} · {m.duration}
                          {m.notes ? ` · ${m.notes}` : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {rxData?.advice && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                    Advice
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {rxData.advice}
                  </Typography>
                </>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button onClick={() => setRxOpen(false)}>Close</Button>
                {rxData?._id && (
                  <Button
                    variant="contained"
                    onClick={downloadPrescriptionPdf}
                    sx={{ textTransform: 'none' }}
                  >
                    Download PDF
                  </Button>
                )}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rxCreateOpen} onClose={() => (!rxCreateLoading ? setRxCreateOpen(false) : null)} maxWidth="md" fullWidth>
        <DialogTitle>Create prescription</DialogTitle>
        <DialogContent>
          {rxCreateError && <Alert severity="error" sx={{ mb: 2 }}>{rxCreateError}</Alert>}
          <Box component="form" onSubmit={submitCreatePrescription} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Diagnosis"
              required
              fullWidth
              value={rxForm.diagnosis}
              onChange={(e) => setRxForm((f) => ({ ...f, diagnosis: e.target.value }))}
            />
            <TextField
              label="Advice (optional)"
              fullWidth
              multiline
              minRows={2}
              value={rxForm.advice}
              onChange={(e) => setRxForm((f) => ({ ...f, advice: e.target.value }))}
            />
            <TextField
              label="Follow-up date (optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={rxForm.followUpDate}
              onChange={(e) => setRxForm((f) => ({ ...f, followUpDate: e.target.value }))}
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              Medicines
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {rxForm.medicines.map((m, idx) => (
                <Card key={`med-${idx}`} variant="outlined">
                  <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                    <TextField
                      label="Name"
                      required
                      value={m.name}
                      onChange={(e) =>
                        setRxForm((f) => {
                          const meds = [...f.medicines];
                          meds[idx] = { ...meds[idx], name: e.target.value };
                          return { ...f, medicines: meds };
                        })
                      }
                    />
                    <TextField
                      label="Dosage"
                      required
                      value={m.dosage}
                      onChange={(e) =>
                        setRxForm((f) => {
                          const meds = [...f.medicines];
                          meds[idx] = { ...meds[idx], dosage: e.target.value };
                          return { ...f, medicines: meds };
                        })
                      }
                    />
                    <TextField
                      label="Frequency"
                      required
                      value={m.frequency}
                      onChange={(e) =>
                        setRxForm((f) => {
                          const meds = [...f.medicines];
                          meds[idx] = { ...meds[idx], frequency: e.target.value };
                          return { ...f, medicines: meds };
                        })
                      }
                    />
                    <TextField
                      label="Duration"
                      required
                      value={m.duration}
                      onChange={(e) =>
                        setRxForm((f) => {
                          const meds = [...f.medicines];
                          meds[idx] = { ...meds[idx], duration: e.target.value };
                          return { ...f, medicines: meds };
                        })
                      }
                    />
                    <TextField
                      label="Notes (optional)"
                      value={m.notes}
                      onChange={(e) =>
                        setRxForm((f) => {
                          const meds = [...f.medicines];
                          meds[idx] = { ...meds[idx], notes: e.target.value };
                          return { ...f, medicines: meds };
                        })
                      }
                      sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                      <Button
                        size="small"
                        onClick={() =>
                          setRxForm((f) => ({
                            ...f,
                            medicines: f.medicines.length > 1 ? f.medicines.filter((_, i) => i !== idx) : f.medicines,
                          }))
                        }
                        disabled={rxForm.medicines.length <= 1}
                      >
                        Remove
                      </Button>
                      {idx === rxForm.medicines.length - 1 && (
                        <Button
                          size="small"
                          onClick={() =>
                            setRxForm((f) => ({
                              ...f,
                              medicines: [...f.medicines, { name: '', dosage: '', frequency: '', duration: '', notes: '' }],
                            }))
                          }
                        >
                          Add more
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
              <Button onClick={() => setRxCreateOpen(false)} disabled={rxCreateLoading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={rxCreateLoading} sx={{ textTransform: 'none' }}>
                {rxCreateLoading ? 'Sending…' : 'Send to patient'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityOpen} onClose={() => (!availabilitySaving ? setAvailabilityOpen(false) : null)} maxWidth="md" fullWidth>
        <DialogTitle>Manage availability</DialogTitle>
        <DialogContent>
          {availabilityLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Select the time slots you are available for each day. Patients will only be able to book from these slots.
              </Typography>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (label, day) => {
                  const dayData = availability.find((a) => a.dayOfWeek === day) || {
                    dayOfWeek: day,
                    slots: [],
                  };
                  return (
                    <Box key={day} sx={{ border: '1px solid #eee', borderRadius: 2, p: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        {label}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {TIME_SLOTS.map((slot) => {
                          const checked = dayData.slots.includes(slot);
                          return (
                            <Chip
                              key={slot}
                              label={slot}
                              color={checked ? 'primary' : 'default'}
                              variant={checked ? 'filled' : 'outlined'}
                              size="small"
                              onClick={() =>
                                setAvailability((prev) =>
                                  prev.map((d) =>
                                    d.dayOfWeek === day
                                      ? {
                                          ...d,
                                          slots: d.slots.includes(slot)
                                            ? d.slots.filter((s) => s !== slot)
                                            : [...d.slots, slot].sort(),
                                        }
                                      : d
                                  )
                                )
                              }
                              sx={{ cursor: 'pointer' }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  );
                }
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button onClick={() => setAvailabilityOpen(false)} disabled={availabilitySaving}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  disabled={availabilitySaving}
                  sx={{ textTransform: 'none' }}
                  onClick={async () => {
                    setAvailabilitySaving(true);
                    try {
                      await axios.put('/doctors/me/availability', { availability });
                      setSnack({
                        open: true,
                        message: 'Availability saved',
                        severity: 'success',
                      });
                      setAvailabilityOpen(false);
                    } catch (err) {
                      setSnack({
                        open: true,
                        message:
                          err.response?.data?.message || 'Could not save availability.',
                        severity: 'error',
                      });
                    } finally {
                      setAvailabilitySaving(false);
                    }
                  }}
                >
                  {availabilitySaving ? 'Saving…' : 'Save'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mhOpen} onClose={() => setMhOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Medical history — {mhPatientName}</DialogTitle>
        <DialogContent>
          {mhLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : mhError ? (
            <Alert severity="info">{mhError}</Alert>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField label="Blood group" value={mhData?.bloodGroup || '—'} InputProps={{ readOnly: true }} />
                <TextField label="Height (cm)" value={mhData?.heightCm ?? '—'} InputProps={{ readOnly: true }} />
                <TextField label="Weight (kg)" value={mhData?.weightKg ?? '—'} InputProps={{ readOnly: true }} />
              </Box>

              <TextField
                label="Allergies"
                value={(mhData?.allergies || []).join(', ') || '—'}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Chronic conditions"
                value={(mhData?.chronicConditions || []).join(', ') || '—'}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Current medications"
                value={(mhData?.currentMedications || []).join(', ') || '—'}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Past surgeries"
                value={(mhData?.pastSurgeries || []).join(', ') || '—'}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Notes"
                value={mhData?.notes || '—'}
                InputProps={{ readOnly: true }}
                fullWidth
                multiline
                minRows={2}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Emergency contact
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField label="Name" value={mhData?.emergencyContact?.name || '—'} InputProps={{ readOnly: true }} />
                <TextField label="Phone" value={mhData?.emergencyContact?.phone || '—'} InputProps={{ readOnly: true }} />
                <TextField
                  label="Relationship"
                  value={mhData?.emergencyContact?.relationship || '—'}
                  InputProps={{ readOnly: true }}
                  sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setMhOpen(false)}>Close</Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.message}
      />
    </Box>
  );
}
