module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("KEY:", apiKey);

    if (!apiKey) {
      return res.status(500).json({
        error: 'API key tidak terbaca'
      });
    }

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    const { messages, max_tokens } = body;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: max_tokens || 1000
          }
        })
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.error) {
      return res.status(500).json({
        error: data.error.message
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Tidak ada respon';

    return res.status(200).json({
      content: [
        {
          type: 'text',
          text
        }
      ]
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
};