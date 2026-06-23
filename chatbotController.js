const axios = require('axios');
const Doctor = require('../models/Doctor');

// Helper: safely normalize chat history for the AI API
const buildSafeHistory = (history) =>
  Array.isArray(history)
    ? history
        .slice(-10)
        .map((m) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          content: String(m?.content || '').slice(0, 2000),
        }))
        .filter((m) => m.content)
    : [];

// Helper: common OpenAI-compatible call
const callAI = async ({ req, message, history, systemPrompt }) => {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey || !apiUrl) {
    return null;
  }

  const safeHistory = buildSafeHistory(history);

  try {
    const response = await axios.post(
      apiUrl,
      {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'system',
            content: `User context: role=${req.user?.role || 'unknown'}, name=${
              req.user?.name || 'unknown'
            }, age=${
              req.user?.dob
                ? Math.max(0, Math.floor((Date.now() - new Date(req.user.dob).getTime()) / 31557600000))
                : 'unknown'
            }.`,
          },
          ...safeHistory,
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return (
      response.data.choices?.[0]?.message?.content ||
      'I could not generate a response right now. Please try again later.'
    );
  } catch (err) {
    console.error('AI provider error', err.response?.data || err.message);
    // Signal to callers to use their own safe fallback text
    return null;
  }
};

// 1) General health assistant (rule-based, safe fallback)
exports.askHealthBot = async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const text = String(message || '');
  const lower = text.toLowerCase();

  let reply =
    'I can give general guidance about common symptoms. For real diagnosis or prescriptions, please book an appointment with a doctor.';

  if (lower.includes('fever') || lower.includes('cold') || lower.includes('cough')) {
    reply =
      'For fever, cold or cough, drink plenty of fluids, rest, and monitor your temperature. If the fever is very high, lasts more than 3–5 days, or you feel very unwell, you should book an appointment with a general physician as soon as possible.';
  } else if (
    lower.includes('chest pain') ||
    lower.includes('heart pain') ||
    lower.includes('pressure in chest') ||
    (lower.includes('pain') && lower.includes('chest'))
  ) {
    reply =
      'Chest or heart pain can be serious. If the pain is strong, new, or comes with breathlessness, sweating, or feeling faint, treat this as an emergency and seek immediate medical care. Even for mild chest discomfort, it is safer to see a cardiologist or general physician quickly.';
  } else if (lower.includes('tooth') || lower.includes('teeth') || lower.includes('gum')) {
    reply =
      'For tooth or gum problems, home remedies only give temporary relief. It is best to book an appointment with a dentist, especially if pain is severe or you notice swelling.';
  } else if (lower.includes('rash') || lower.includes('itch') || lower.includes('skin')) {
    reply =
      'Skin rashes and itching can have many causes. Avoid scratching and using strong perfumes or new creams. If the rash is spreading, painful, or with fever, you should book an appointment with a dermatologist.';
  } else if (lower.includes('headache') || lower.includes('migraine')) {
    reply =
      'For common headaches, rest, hydration and avoiding screen time may help. But if the headache is sudden, very severe, with weakness, confusion, vision changes or fever, treat it as urgent and see a doctor immediately. Otherwise, you can book a consultation with a general physician.';
  }

  return res.json({
    reply,
    suggestions: ['Book an appointment', 'View emergency warning signs', 'Go to appointments page'],
  });
};

// 2) Appointment assistant – guide user to correct place and explain steps
exports.askAppointmentAssistant = async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const lower = String(message || '').toLowerCase();
  let reply;

  if (lower.includes('cancel')) {
    reply =
      'To cancel an appointment, open the Appointments page, find your booking in the list and use the cancel option. If your visit is very soon, please also inform the clinic directly so the slot can be given to someone else.';
  } else if (lower.includes('reschedul') || (lower.includes('change') && (lower.includes('time') || lower.includes('date')))) {
    reply =
      'To reschedule, you can cancel the existing appointment from the Appointments page and then book a new one with your preferred date and time. Make sure to pick a slot that is still available in the doctor’s schedule.';
  } else {
    reply =
      'To book an appointment, go to the Appointments page and click “Book appointment”. Then select a doctor, choose a date, pick one of the available time slots, and choose in-person or online. Once you confirm, your booking request will be sent to the doctor.';
  }

  return res.json({
    reply,
    actionHints: ['open_appointments_page', 'book', 'reschedule', 'cancel'],
  });
};

// 3) FAQ / support bot – rule-based answers for common topics
exports.askFaqBot = async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const clinicName = process.env.CLINIC_NAME || 'our clinic';
  const lower = String(message || '').toLowerCase();
  let reply;

  if (lower.includes('cancel')) {
    reply =
      'You can cancel an appointment from the Appointments page by selecting your booking and using the cancel option. Please cancel as early as possible so the slot can be given to another patient.';
  } else if (lower.includes('work') && (lower.includes('hour') || lower.includes('timing') || lower.includes('time'))) {
    reply =
      `${clinicName} usually operates during normal daytime hours on weekdays, with limited slots on weekends. For the exact timings and holidays, please check the clinic information section in the portal or call the front desk.`;
  } else if (lower.includes('online') || lower.includes('video') || lower.includes('tele')) {
    reply =
      `${clinicName} supports online/teleconsultation for many conditions. While booking, choose the “Online” mode instead of “In-person”, and you will receive details on how to join the call once the appointment is scheduled.`;
  } else if (lower.includes('fee') || lower.includes('price') || lower.includes('cost')) {
    reply =
      'Consultation fees can vary by doctor and speciality. You can usually see an approximate fee when selecting a doctor in the booking form, but for exact and latest pricing, please contact the clinic directly.';
  } else {
    reply =
      `You can ask about clinic timings, how to book or cancel, teleconsultation, and general process. For anything very specific (like exact fees or insurance coverage), it is best to contact ${clinicName} directly.`;
  }

  return res.json({
    reply,
    suggestions: ['Open appointments page', 'How to cancel appointment?', 'What are your working hours?'],
  });
};

// Simple rule-based speciality suggestion as a fallback or baseline.
// Returns both a human-friendly text and a suggested speciality keyword for DB search.
const suggestSpecialityFallback = (rawText) => {
  const text = String(rawText || '').toLowerCase();

  if (!text.trim()) {
    return {
      text:
        'Please describe your symptoms briefly (for example: “high fever and cough since 2 days”). Based on that I will suggest which type of doctor to see.',
      speciality: null,
    };
  }

  // Very coarse rules just to give a helpful direction
  if (
    text.includes('chest pain') ||
    text.includes('heart pain') ||
    text.includes('pressure in chest') ||
    text.includes('tightness in chest') ||
    (text.includes('pain') && text.includes('chest'))
  ) {
    return {
      text:
        'Chest or heart pain can be serious. Please treat this as urgent and, if available, visit the emergency department or a cardiologist as soon as possible.',
      speciality: 'cardiologist',
    };
  }
  if (text.includes('fever') || text.includes('cold') || text.includes('cough') || text.includes('throat')) {
    return {
      text:
        'For fever, cold, cough or throat pain, it is best to see a general physician (family doctor). If the fever is very high, in a small child, or lasts more than 3–5 days, seek medical care as soon as possible.',
      speciality: 'general physician',
    };
  }
  if (text.includes('rash') || text.includes('skin') || text.includes('itch')) {
    return {
      text:
        'For skin rashes or itching, you can book an appointment with a dermatologist. If there is sudden swelling of lips, tongue or trouble breathing, seek emergency care.',
      speciality: 'dermatologist',
    };
  }
  if (text.includes('tooth') || text.includes('teeth') || text.includes('gum') || text.includes('dental')) {
    return {
      text:
        'For tooth or gum problems, please see a dentist. For severe sudden tooth pain, try to see a dentist within 24 hours.',
      speciality: 'dentist',
    };
  }
  if (text.includes('headache') || text.includes('migraine')) {
    return {
      text:
        'For recurrent or strong headaches, you can first see a general physician. If headaches are severe, sudden, with weakness, confusion or vision changes, treat it as urgent and seek immediate medical care.',
      speciality: 'general physician',
    };
  }
  if (text.includes('back pain') || text.includes('joint') || text.includes('knee') || text.includes('shoulder')) {
    return {
      text:
        'For back or joint pains, you can see an orthopedician. If the pain is after major injury or with loss of sensation or bladder/bowel control, seek emergency care.',
      speciality: 'orthopedician',
    };
  }
  if (text.includes('depress') || text.includes('anxiety') || text.includes('suicid') || text.includes('panic')) {
    return {
      text:
        'For mood changes, depression or anxiety, you can see a psychiatrist or psychologist. If you have thoughts of self-harm or suicide, treat this as an emergency and contact local emergency services or a crisis helpline immediately.',
      speciality: 'psychiatrist',
    };
  }
  if (text.includes('pregnan') || text.includes('period') || text.includes('menstrual') || text.includes('gyne')) {
    return {
      text:
        'For pregnancy, menstrual issues or women’s health concerns, you can see a gynecologist. If there is heavy bleeding or severe lower abdominal pain, seek urgent medical care.',
      speciality: 'gynecologist',
    };
  }
  if (text.includes('child') || text.includes('baby') || text.includes('infant')) {
    return {
      text:
        'For health issues in babies and children, please see a pediatrician. For very high fever, breathing difficulty, or if the child looks very unwell, treat it as an emergency.',
      speciality: 'pediatrician',
    };
  }
  if (text.includes('ear') || text.includes('nose') || text.includes('throat') || text.includes('sinus')) {
    return {
      text:
        'For ear, nose or throat problems, you can see an ENT specialist. If there is severe pain, high fever, or trouble breathing, seek care promptly.',
      speciality: 'ENT',
    };
  }

  return {
    text:
      'Based on your description, you can start by booking an appointment with a general physician. They can examine you and, if needed, refer you to a suitable specialist. If your symptoms suddenly become severe, or you feel very unwell, treat it as an emergency and seek immediate care.',
    speciality: 'general physician',
  };
};

// 4) AI triage assistant for booking flow
// Patient describes symptoms → high-level possible causes + which doctor speciality to see.
exports.askTriageAssistant = async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    // First try full AI triage if configured
    const reply = await callAI({
      req,
      message,
      history,
      systemPrompt: [
        'You are a cautious medical triage assistant for an online appointment system.',
        'The user will briefly describe symptoms or a known disease name.',
        'Your job is to: (1) describe in 1–2 short sentences what could be going on at a very high level,',
        'and (2) clearly recommend which doctor speciality they should book (e.g. general physician, cardiologist, dermatologist, orthopedician, psychiatrist, gynecologist, pediatrician, neurologist, ENT, dentist).',
        'Always include how urgent it might be (emergency now, within 24 hours, within a few days, or routine).',
        'NEVER give a firm diagnosis or specific treatment; always say it is only a possible explanation and they must see a doctor for confirmation.',
        'Output must be plain text, 3–5 short sentences maximum.',
      ].join(' '),
    });

    // If AI responds, return it directly (it should already mention speciality)
    if (reply) {
      return res.json({ reply });
    }

    // If AI is not configured or fails silently, fall back to rule-based suggestion + real doctor.
    const { text, speciality } = suggestSpecialityFallback(message);
    let doctorLine = '';
    try {
      let doctor = null;
      if (speciality) {
        doctor = await Doctor.findOne({
          specialization: new RegExp(speciality, 'i'),
        }).populate('user', 'name');
      }
      // Only suggest a named doctor if we found one with matching speciality,
      // or if the suggested speciality is a generic "general physician".
      if (
        doctor &&
        doctor.user?.name &&
        (speciality === 'general physician' ||
          new RegExp(speciality, 'i').test(doctor.specialization || ''))
      ) {
        doctorLine = ` You can book an appointment with ${doctor.user.name} (${doctor.specialization}).`;
      }
    } catch {
      // ignore DB errors in fallback
    }

    return res.json({
      reply: text + doctorLine,
    });
  } catch (err) {
    console.error('AI triage assistant error', err.response?.data || err.message);
    const { text, speciality } = suggestSpecialityFallback(message);
    let doctorLine = '';
    try {
      let doctor = null;
      if (speciality) {
        doctor = await Doctor.findOne({
          specialization: new RegExp(speciality, 'i'),
        }).populate('user', 'name');
      }
      if (
        doctor &&
        doctor.user?.name &&
        (speciality === 'general physician' ||
          new RegExp(speciality, 'i').test(doctor.specialization || ''))
      ) {
        doctorLine = ` You can book an appointment with ${doctor.user.name} (${doctor.specialization}).`;
      }
    } catch {
      // ignore DB errors in fallback
    }

    return res.json({
      reply: text + doctorLine,
    });
  }
};


