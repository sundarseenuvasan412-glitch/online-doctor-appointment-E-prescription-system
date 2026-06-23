import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Grid, Chip, Avatar } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const departments = [
    { name: 'Cardiology', years: '18+ yrs experience' },
    { name: 'Neurology', years: '15+ yrs experience' },
    { name: 'Orthopedics', years: '20+ yrs experience' },
    { name: 'Pediatrics', years: '12+ yrs experience' },
    { name: 'Dermatology', years: '10+ yrs experience' },
    { name: 'Diabetology', years: '16+ yrs experience' },
  ];

  const doctors = [
    {
      name: 'Dr. Anitha Rao',
      photo: 'https://images.pexels.com/photos/5327581/pexels-photo-5327581.jpeg?auto=compress&w=120',
      specialization: 'Cardiologist',
      years: '18 yrs',
      rating: '4.9',
    },
    {
      name: 'Dr. Karthik Menon',
      photo: 'https://images.pexels.com/photos/8460128/pexels-photo-8460128.jpeg?auto=compress&w=120',
      specialization: 'Neurologist',
      years: '15 yrs',
      rating: '4.8',
    },
    {
      name: 'Dr. Nisha Thomas',
      photo: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&w=120',
      specialization: 'Orthopedic Surgeon',
      years: '20 yrs',
      rating: '4.7',
    },
    {
      name: 'Dr. Rahul Verma',
      photo: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&w=120',
      specialization: 'Pediatrician',
      years: '12 yrs',
      rating: '4.9',
    },
    {
      name: 'Dr. Meera Iyer',
      photo: 'https://images.pexels.com/photos/3957987/pexels-photo-3957987.jpeg?auto=compress&w=120',
      specialization: 'Dermatologist',
      years: '10 yrs',
      rating: '4.8',
    },
  ];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', bgcolor: 'background.default' }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ecfeff, #f9fafb)',
          color: 'text.primary',
          py: { xs: 6, md: 10 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          CareConnect Multispeciality Hospital
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 720, mx: 'auto', mb: 1.5 }}>
          24x7 digital hospital experience with OPD, online consultations, lab reports and e‑
          prescriptions — all in one secure portal.
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 640, mx: 'auto', mb: 4 }}>
          Serving patients across cardiology, neurology, orthopedics, pediatrics, dermatology and
          more with senior consultants and real‑time updates.
        </Typography>
        {/* Departments marquee */}
        <Box
          sx={{
            mt: 5,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              gap: 2,
                animation: 'marquee 28s linear infinite',
              '@keyframes marquee': {
                '0%': { transform: 'translateX(0)' },
                '100%': { transform: 'translateX(-50%)' },
              },
            }}
          >
            {[...departments, ...departments].map((dept, idx) => (
              <Chip
                key={`${dept.name}-${idx}`}
                label={`${dept.name} · ${dept.years}`}
                sx={{
                  bgcolor: 'rgba(15,118,110,0.12)',
                  color: 'primary.dark',
                  borderRadius: 999,
                  px: 1.5,
                  border: '1px solid rgba(15,118,110,0.25)',
                  '& .MuiChip-label': { px: 1, fontSize: 13, fontWeight: 600 },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Trusted doctors marquee (make this prominent, second section) */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, px: 2 }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2, textAlign: 'left' }}>
            Trusted doctors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Meet a few of our senior consultants available on CareConnect.
          </Typography>
          <Box
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                gap: 2,
                py: 1,
                animation: 'marqueeDocs 35s linear infinite',
                '@keyframes marqueeDocs': {
                  '0%': { transform: 'translateX(0)' },
                  '100%': { transform: 'translateX(-50%)' },
                },
              }}
            >
              {[...doctors, ...doctors].map((doc, idx) => (
                <Card
                  key={`${doc.name}-${idx}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    minWidth: 260,
                  }}
                >
                  <Avatar
                    src={doc.photo}
                    alt={doc.name}
                    sx={{ width: 44, height: 44 }}
                  >
                    {doc.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap fontWeight={600}>
                      {doc.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
                      {doc.specialization}
                    </Typography>
                    <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 600 }}>
                      {doc.years} • ⭐ {doc.rating}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Features */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', py: 6, px: 2 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 4 }}>
          Why patients and doctors choose CareConnect
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                  <CalendarMonthIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Book anytime
                </Typography>
                <Typography color="text.secondary">
                  Choose your doctor and time slot. Get instant confirmation and real-time status updates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                  <MedicalServicesIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Super-speciality care
                </Typography>
                <Typography color="text.secondary">
                  Connect with multi-department specialists. View prescriptions, medical history and
                  lab reports in one secure place.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                  <ChatIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Health assistant
                </Typography>
                <Typography color="text.secondary">
                  Use the chat widget for quick guidance. For emergencies, always contact local emergency services.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                  <CalendarMonthIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Real-time hospital view
                </Typography>
                <Typography color="text.secondary">
                  See appointment status, prescriptions, lab reports and vitals update in real time
                  across patient and doctor dashboards.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Contact section */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, px: 2 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 2 }}>
            Contact & support
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            For appointments and support, reach out to our hospital helpdesk. For emergencies, always
            contact your local emergency services.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Hospital address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CareConnect Multispeciality Hospital
                    <br />
                    123 Health Avenue, City Center
                    <br />
                    Chennai, India
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Phone & email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Helpline: +91-98765-43210
                    <br />
                    Appointments: careconnect@hospital.com
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Digital support
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    For issues with online booking or reports, raise a ticket from your dashboard or
                    chat with our virtual assistant.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
