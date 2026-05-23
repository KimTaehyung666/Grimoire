module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    // Ambil API key
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('KEY EXISTS:', !!apiKey);

    if (!apiKey) {
      return res.status(500).json({
        error: 'API key tidak ditemukan'
      });
    }

    // Parse body
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    console.log('BODY:', body);

    // Validasi body
    if (!body || !body.messages) {
      return res.status(400).json({
        error: 'messages tidak ada'
      });
    }

    const { messages, max_tokens } = body;

    // Format Gemini
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: m.content
        }
      ]
    }));

    // Request ke Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: max_tokens || 8000,
            temperature: 0.9
          }
        })
      }
    );

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    console.log('GEMINI RESPONSE:', data);

    // Error Gemini
    if (data.error) {
      return res.status(500).json({
        error: data.error.message
      });
    }

    // Ambil text hasil
    const candidate = data?.candidates?.[0];

	console.log("FINISH REASON:", candidate?.finishReason);

	const text =
  	candidate?.content?.parts
		?.map(p => p.text || '')
    	.join('') ||
 	 'Tidak ada respon dari AI';
	// Return sukses
    return res.status(200).json({
      content: [
        {
          type: 'text',
          text
        }
      ]
    });

  } catch (err) {
    console.error('SERVER ERROR:', err);

    return res.status(500).json({
      error: err.message || 'Internal server error'
    });
  }
};

