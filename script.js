async function callClaude(prompt) {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();

    console.log(data);

    if (data.error) {
      return "ERROR: " + data.error;
    }

    return (
      data.content?.[0]?.text ||
      'Tidak ada respon.'
    );

  } catch (err) {
    console.error(err);
    return 'Terjadi kesalahan.';
  }
}


