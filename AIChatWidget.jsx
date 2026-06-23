import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hi, I am your virtual health assistant. Describe your symptoms, and I can suggest when to see a doctor.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mode, setMode] = useState('health'); // 'health' | 'appointments' | 'faq'

  const toggle = () => setOpen((prev) => !prev);

  const sendMessage = async (e, overrideText) => {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: 'you', text }]);
    setInput('');
    setSuggestions([]);
    setLoading(true);
    try {
      const history = messages
        .slice(-8)
        .filter((m) => m.from === 'you' || m.from === 'bot')
        .map((m) => ({
          role: m.from === 'bot' ? 'assistant' : 'user',
          content: m.text,
        }));

      let endpoint = '/chatbot/ask';
      if (mode === 'appointments') {
        endpoint = '/chatbot/appointment';
      } else if (mode === 'faq') {
        endpoint = '/chatbot/faq';
      }

      const { data } = await axios.post(endpoint, { message: text, history });
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply }]);
      setSuggestions(
        Array.isArray(data.suggestions || data.actionHints)
          ? (data.suggestions || data.actionHints).slice(0, 6)
          : []
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text:
            'Sorry, I am unavailable right now. Please try again later or contact a doctor directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1500,
        }}
      >
        <IconButton
          color="primary"
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            color: 'white',
            width: 64,
            height: 64,
            boxShadow: 6,
          }}
          onClick={toggle}
        >
          {open ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
        </IconButton>
      </Box>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 104,
            width: 360,
            maxWidth: '90vw',
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
            zIndex: 1500,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {mode === 'health'
                ? 'Health Assistant'
                : mode === 'appointments'
                ? 'Appointment Assistant'
                : 'Help & FAQ Assistant'}
            </Typography>
            <Typography variant="caption">
              {mode === 'health'
                ? 'General guidance only. For emergencies, contact your doctor or local emergency services.'
                : mode === 'appointments'
                ? 'I can help you with booking, rescheduling, or cancelling appointments.'
                : 'Ask about clinic timings, booking rules, cancellation, teleconsultation and more.'}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label="Health"
                size="small"
                color={mode === 'health' ? 'secondary' : 'default'}
                onClick={() => setMode('health')}
              />
              <Chip
                label="Appointments"
                size="small"
                color={mode === 'appointments' ? 'secondary' : 'default'}
                onClick={() => setMode('appointments')}
              />
              <Chip
                label="FAQ"
                size="small"
                color={mode === 'faq' ? 'secondary' : 'default'}
                onClick={() => setMode('faq')}
              />
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 2,
              bgcolor: 'background.default',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {messages.map((m, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: m.from === 'you' ? 'flex-end' : 'flex-start',
                  bgcolor: m.from === 'you' ? 'primary.main' : 'grey.100',
                  color: m.from === 'you' ? 'primary.contrastText' : 'text.primary',
                  px: 1.5,
                  py: 1,
                  borderRadius: 3,
                  maxWidth: '85%',
                  boxShadow: 1,
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {m.from === 'you' ? 'You' : 'Assistant'}
                </Typography>
                <Typography variant="body2">{m.text}</Typography>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {!loading && suggestions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {suggestions.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => sendMessage(null, s)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Box
            component="form"
            onSubmit={sendMessage}
            sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1 }}
          >
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              placeholder="Describe your symptoms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <IconButton color="primary" type="submit" disabled={loading}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AIChatWidget;

